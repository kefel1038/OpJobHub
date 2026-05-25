import type { ScrapedJob } from "../lib/scraper-engine";
import { PlaywrightScraper } from "../lib/playwright-scraper";
import { logger } from "../lib/logger";

const URL = "https://www.el7far.com/qa/";

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/undefined/gi, "")
    .trim();
}

export async function scrapeEl7far(): Promise<ScrapedJob[]> {
  const pw = PlaywrightScraper.getInstance();
  const page = await pw.navigate(URL, { timeout: 45_000, retries: 2 });

  try {
    logger.info("El7far scrape started");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

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

    logger.info({ count: jobs.length, url: URL }, "El7far: extracted from DOM");

    if (jobs.length === 0) {
      await pw.captureDebug(page, "el7far-no-jobs");
      logger.warn("El7far: zero jobs extracted, debug snapshot captured");
      return [];
    }

    const normalized: ScrapedJob[] = jobs.map((j) => ({
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

    logger.info({ count: normalized.length }, "El7far scrape complete");
    return normalized;
  } catch (err: any) {
    logger.error({ err, url: URL }, "El7far scrape failed");
    return [];
  } finally {
    await page.close().catch(() => {});
  }
}
