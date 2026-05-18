import type { ScrapedJob } from "../lib/scraper-engine";
import { PlaywrightScraper } from "../lib/playwright-scraper";
import { logger } from "../lib/logger";

const URL = "https://www.bayt.com/en/qatar/jobs/";

const CARD_SELECTORS = [
  "li[data-js-job]",
  "li.job-card",
  "div.has-details",
  ".media-list > li[data-job-id]",
  "article[data-job-id]",
];

export async function scrapeBaytQatar(): Promise<ScrapedJob[]> {
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
        logger.info({ selector: sel, count }, "Bayt: found card selector");
        break;
      }
    }

    if (!cardSelector) {
      await pw.captureDebug(page, "bayt-no-selector");
      logger.warn("Bayt: no known card selector matched");
      return [];
    }

    const jobs = await pw.extractJobs(
      page,
      cardSelector,
      {
        title: "h2 a",
        company: ".job-company-location-wrapper .t-default.t-bold, .job-company-location-wrapper a[class*=t-default]",
        location: ".job-company-location-wrapper .t-mute",
        description: ".jb-descr",
        salary: ".jb-label-salary",
        link: "h2 a",
      },
      "Bayt Qatar",
      URL,
    );

    return jobs;
  } finally {
    await page.close().catch(() => {});
  }
}
