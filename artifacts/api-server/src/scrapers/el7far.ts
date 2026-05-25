import type { ScrapedJob } from "../lib/scraper-engine";
import { PlaywrightScraper } from "../lib/playwright-scraper";
import { logger } from "../lib/logger";

const URLS = [
  "https://www.el7far.com/qa/",
  "https://el7far.com/jobs/qatar",
  "https://www.el7far.com/qa/en/",
];

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/undefined/gi, "")
    .trim();
}

async function extractJobsFromPage(page: any): Promise<ScrapedJob[]> {
  const jobs = await page.evaluate(() => {
    const seen = new Set<string>();
    const results: Array<{
      title: string;
      href: string;
      location: string;
      description: string;
    }> = [];

    const clean = (t: string): string =>
      t.replace(/\s+/g, " ").replace(/undefined/gi, "").trim();

    const links = document.querySelectorAll<HTMLAnchorElement>(
      "a[href*='job'], a[href*='jobs']",
    );

    for (const link of links) {
      const href = link.getAttribute("href");
      if (!href || seen.has(href)) continue;

      const title = clean(link.textContent || "");
      if (title.length < 5) continue;

      seen.add(href);

      const card =
        link.closest<HTMLElement>("article, div, li") ||
        link.parentElement;
      const cardText = card ? clean(card.textContent || "") : "";
      const fullHref = href.startsWith("http")
        ? href
        : `https://www.el7far.com${href.startsWith("/") ? "" : "/"}${href}`;

      let location = "";
      const locationMatch = cardText.match(
        /(?:location|مكان|مدينة|دولة|في)\s*:?\s*([^\n,،]+)/i,
      );
      if (locationMatch) {
        location = clean(locationMatch[1]);
      } else if (/doha|الدوحة|qatar|قطر/i.test(cardText)) {
        const match = cardText.match(/Doha|الدوحة|Qatar|قطر/i);
        if (match) location = match[0];
      }

      results.push({
        title,
        href: fullHref,
        location,
        description: cardText || title,
      });

      if (results.length >= 30) break;
    }

    return results;
  });

  if (jobs.length === 0) return [];

  return jobs.map((j: any) => ({
    title: cleanText(j.title),
    company: "El7far",
    location: j.location || "Qatar",
    description: j.description || "View full description on employer website",
    source: "El7far",
    sourceUrl: j.href,
    applyUrl: j.href,
    employmentType: "Full-Time",
    postedAt: new Date(),
  }));
}

export async function scrapeEl7far(): Promise<ScrapedJob[]> {
  const pw = PlaywrightScraper.getInstance();
  const page = await pw.createPage();

  try {
    logger.info("El7far scrape started");

    await page.route("**/*", (route) => {
      const type = route.request().resourceType();
      if (type === "image" || type === "font" || type === "media") {
        return route.abort();
      }
      return route.continue();
    });

    let loaded = false;
    for (const url of URLS) {
      try {
        logger.info({ url }, "El7far: attempting navigation");
        await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 30_000,
        });
        await page.waitForTimeout(5000);
        await page
          .waitForSelector("a[href*='job'], a[href*='jobs'], article, .job-card", {
            timeout: 10_000,
          })
          .catch(() => {});
        loaded = true;
        break;
      } catch (err: any) {
        logger.warn({ url, error: err.message }, "El7far: navigation failed, trying next URL");
      }
    }

    if (!loaded) {
      await pw.captureDebug(page, "el7far-all-urls-failed");
      logger.error("El7far: all URLs failed to load");
      return [];
    }

    const jobs = await extractJobsFromPage(page);

    logger.info({ count: jobs.length }, "El7far: extracted from DOM");

    if (jobs.length === 0) {
      await pw.captureDebug(page, "el7far-no-jobs");
      logger.warn("El7far: zero jobs extracted, debug snapshot captured");
      return [];
    }

    logger.info({ count: jobs.length }, "El7far scrape complete");
    return jobs;
  } catch (err: any) {
    logger.error({ err }, "El7far scrape failed");
    return [];
  } finally {
    await page.close().catch(() => {});
  }
}
