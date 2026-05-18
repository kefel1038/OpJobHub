import type { ScrapedJob } from "../lib/scraper-engine";
import { PlaywrightScraper } from "../lib/playwright-scraper";
import { logger } from "../lib/logger";

const URL = "https://qa.indeed.com/jobs?q=&l=Qatar";

const CARD_SELECTORS = [
  "div.job_seen_beacon",
  "div[data-testid='job-card']",
  "div[id^='jobCard']",
  "li[class*=job]",
  ".jobsearch-ResultsList > div",
];

export async function scrapeIndeedQatar(): Promise<ScrapedJob[]> {
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
        logger.info({ selector: sel, count }, "Indeed: found card selector");
        break;
      }
    }

    if (!cardSelector) {
      await pw.captureDebug(page, "indeed-no-selector");
      logger.warn("Indeed: no known card selector matched");
      return [];
    }

    const jobs = await pw.extractJobs(
      page,
      cardSelector,
      {
        title: "h2.jobTitle a, a.jcs-JobTitle, h2 a[data-jk]",
        company: "span.companyName, [data-testid='company-name'], span[class*=company]",
        location: "div.companyLocation, [data-testid='text-location'], div[class*=location]",
        salary: "div.salary-snippet, [data-testid='salary']",
        description: "div.job-snippet, ul.job-snippet li, [data-testid='job-snippet']",
        link: "a.jcs-JobTitle, h2.jobTitle a, a[data-jk]",
      },
      "Indeed Qatar",
      URL,
    );

    return jobs;
  } finally {
    await page.close().catch(() => {});
  }
}
