import type { ScrapedJob } from "../lib/scraper-engine";
import { PlaywrightScraper } from "../lib/playwright-scraper";
import { logger } from "../lib/logger";

const URL = "https://www.gulftalent.com/qatar/jobs";

const CARD_SELECTORS = [
  "tr.content-visibility-auto",
  ".job-listing",
  "div[class*='job-listing']",
  "div[class*='job-card']",
  "li[class*=job]",
  "article",
  ".search-result",
];

export async function scrapeGulfTalent(): Promise<ScrapedJob[]> {
  const pw = PlaywrightScraper.getInstance();
  const page = await pw.navigate(URL, { timeout: 45_000, retries: 2 });

  try {
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    let cardSelector = "";
    for (const sel of CARD_SELECTORS) {
      const count = await page.locator(sel).count();
      if (count > 0) {
        cardSelector = sel;
        logger.info({ selector: sel, count }, "GulfTalent: found card selector");
        break;
      }
    }

    if (!cardSelector) {
      await pw.captureDebug(page, "gulf-talent-no-selector");
      logger.warn("GulfTalent: no known card selector matched");
      return [];
    }

    const jobs = await pw.extractJobs(
      page,
      cardSelector,
      {
        title: "h2 a.ga-job-click, h2 a, h3 a, .job-title a, a[class*=title]",
        company: "a.text-secondary-hover, .company, .company-name, .employer",
        location: "td:nth-child(2) span, td:nth-child(2) a, .location, .loc, .job-location",
        description: ".job-description-in-listing, .desc p, .summary, .job-description",
        link: "h2 a.ga-job-click, h2 a, h3 a, a[href*='/job/'], a[href*='/position/']",
      },
      "GulfTalent",
      URL,
    );

    return jobs;
  } finally {
    await page.close().catch(() => {});
  }
}
