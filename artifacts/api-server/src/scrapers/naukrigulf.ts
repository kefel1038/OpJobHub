import type { ScrapedJob } from "../lib/scraper-engine";
import { PlaywrightScraper } from "../lib/playwright-scraper";
import { logger } from "../lib/logger";

const URL = "https://www.naukrigulf.com/qatar-jobs";

const CARD_SELECTORS = [
  "div.ng-box.srp-tuple",
  "div.srp-tuple",
  ".job-tuple",
  ".job-card",
  "article[class*=job]",
];

export async function scrapeNaukrigulf(): Promise<ScrapedJob[]> {
  const pw = PlaywrightScraper.getInstance();
  const page = await pw.navigate(URL, { timeout: 45_000, retries: 2 });

  try {
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    let cardSelector = "";
    for (const sel of CARD_SELECTORS) {
      const count = await page.locator(sel).count();
      if (count > 0) {
        cardSelector = sel;
        logger.info({ selector: sel, count }, "NaukriGulf: found card selector");
        break;
      }
    }

    if (!cardSelector) {
      await pw.captureDebug(page, "naukrigulf-no-selector");
      logger.warn("NaukriGulf: no known card selector matched");
      return [];
    }

    const jobs = await pw.extractJobs(
      page,
      cardSelector,
      {
        title: "a.info-position p.designation-title",
        company: "a.info-org, a.info-position p.info-org",
        location: "ul.reco-ul li.info-loc span:last-child",
        description: "p.description",
        link: "a.info-position",
      },
      "Naukri Gulf",
      URL,
    );

    return jobs;
  } finally {
    await page.close().catch(() => {});
  }
}
