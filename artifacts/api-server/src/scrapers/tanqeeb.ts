import type { ScrapedJob } from "../lib/scraper-engine";
import { PlaywrightScraper } from "../lib/playwright-scraper";
import { logger } from "../lib/logger";

const URL = "https://qatar.tanqeeb.com/en";

const CARD_SELECTORS = [
  "#home-jobs article.latest-job-card",
  "article.latest-job-card",
  ".job-card",
  "div[class*='job-card']",
  ".job-listing",
];

export async function scrapeTanqeeb(): Promise<ScrapedJob[]> {
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
        logger.info({ selector: sel, count }, "Tanqeeb: found card selector");
        break;
      }
    }

    if (!cardSelector) {
      await pw.captureDebug(page, "tanqeeb-no-selector");
      logger.warn("Tanqeeb: no known card selector matched");
      return [];
    }

    const jobs = await pw.extractJobs(
      page,
      cardSelector,
      {
        title: "h5.mb-2, h5 a, h5 [class*=text-truncate]",
        company: "span.latest-job-company-name, [class*=company-name]",
        location: "span.latest-job-location-text, [class*=location-text]",
        description: ".latest-job-description, .description",
        link: "a.link-block, a[href*='/jobs-in-qatar/'], a[href*='/job/']",
      },
      "Tanqeeb",
      URL,
    );

    return jobs;
  } finally {
    await page.close().catch(() => {});
  }
}
