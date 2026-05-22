import type { ScrapedJob } from "../lib/scraper-engine";
import { PlaywrightScraper } from "../lib/playwright-scraper";
import { logger } from "../lib/logger";

const URL = "https://mzadqatar.com/en/job-vacancies/job-offer";
const MAX_PAGES = 3;

export async function scrapeMzadQatar(): Promise<ScrapedJob[]> {
  const pw = PlaywrightScraper.getInstance();
  const page = await pw.navigate(URL, { timeout: 45_000, retries: 2 });

  try {
    await page.waitForLoadState("networkidle");
    await page.waitForSelector(".products_section_helper", { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const allJobs: ScrapedJob[] = [];

    for (let p = 0; p < MAX_PAGES; p++) {
      if (p > 0) {
        const nextBtn = page.locator("a.page[rel='next']");
        if ((await nextBtn.count()) === 0) break;
        const href = await nextBtn.getAttribute("href");
        if (!href) break;
        await page.goto(new URL(href, URL).href, { waitUntil: "networkidle", timeout: 30_000 });
        await page.waitForSelector(".products_section_helper", { timeout: 10_000 }).catch(() => {});
        await page.waitForTimeout(2000);
      }

      const jobs = await page.evaluate(() => {
        const cards = document.querySelectorAll<HTMLElement>(".products_section_helper");
        const results: Array<{
          title: string;
          company: string;
          link: string;
          location: string;
          salary: string;
          description: string;
        }> = [];

        const seen = new Set<string>();

        cards.forEach((card) => {
          const isVip = !!card.querySelector(".vip_highlight_listing");

          let linkEl: HTMLAnchorElement | null;
          let titleEl: HTMLElement | null;
          let salaryEl: HTMLElement | null;
          let descEl: HTMLElement | null;

          if (isVip) {
            const detailWrap = card.querySelector<HTMLElement>(".vip_listing_detail_wrap");
            linkEl = card.querySelector<HTMLAnchorElement>(".vip_listing_thumb_wrap a");
            titleEl = detailWrap?.querySelector<HTMLElement>("h3");
            salaryEl = card.querySelector<HTMLElement>(".vip_price_val");
            descEl = detailWrap?.querySelector<HTMLElement>("p");
          } else {
            linkEl = card.querySelector<HTMLAnchorElement>("a.image_section");
            titleEl = card.querySelector<HTMLElement>("h3.product_card_title");
            salaryEl = card.querySelector<HTMLElement>("p.custom_color_currency");
            descEl = card.querySelector<HTMLElement>("p.description");
          }

          const href = linkEl?.getAttribute("href");
          if (!href || !href.includes("/products/") || seen.has(href)) return;
          seen.add(href);

          const title = titleEl?.textContent?.trim();
          if (!title || title.length < 2) return;

          const salary = salaryEl?.textContent?.trim() || "";
          const description = descEl?.textContent?.trim() || "";
          const link = href.startsWith("http") ? href : `https://mzadqatar.com${href}`;

          const allText = card.textContent || "";
          const locationMatch = allText.match(/Doha|Al\s+\w+|Qatar/i);

          results.push({
            title,
            company: "Mzad Qatar",
            link,
            location: locationMatch?.[0] || "Doha, Qatar",
            salary,
            description: description || `Position: ${title}. View details on Mzad Qatar.`,
          });
        });

        return results;
      });

      allJobs.push(
        ...jobs.map((j) => ({
          title: j.title,
          company: j.company,
          location: j.location,
          salary: j.salary || undefined,
          description: j.description,
          source: "Mzad Qatar" as const,
          sourceUrl: j.link,
          applyUrl: j.link,
          employmentType: "Full-Time" as const,
          postedAt: new Date(),
        })),
      );

      if (jobs.length < 20) break;
    }

    logger.info({ count: allJobs.length }, "MzadQatar: extracted from DOM");
    return allJobs;
  } finally {
    await page.close().catch(() => {});
  }
}
