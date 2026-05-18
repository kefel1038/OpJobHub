import type { ScrapedJob } from "../lib/scraper-engine";
import { PlaywrightScraper } from "../lib/playwright-scraper";
import { logger } from "../lib/logger";

const URL = "https://www.qatarliving.com/jobs";
const API_URLS = [
  "https://www.qatarliving.com/api/jobs/search?type=corporate&page=1&pageSize=25",
  "https://www.qatarliving.com/api/jobs/list?type=corporate&page=1&limit=25",
  "https://www.qatarliving.com/api/jobs/featured",
];

export async function scrapeQatarLiving(): Promise<ScrapedJob[]> {
  const pw = PlaywrightScraper.getInstance();

  // Try direct API fetch via Playwright (handles cookies/auth)
  for (const apiUrl of API_URLS) {
    try {
      const jobs = await tryFetchApi(pw, apiUrl);
      if (jobs.length > 0) {
        logger.info({ count: jobs.length, url: apiUrl }, "QatarLiving: got jobs from API");
        return jobs;
      }
    } catch (err: any) {
      logger.warn({ url: apiUrl, error: err.message }, "QatarLiving: API fetch failed");
    }
  }

  // Fallback: intercept API calls from page + extract rendered DOM
  const page = await pw.createPage();
  let capturedJobs: ScrapedJob[] = [];

  page.on("response", async (response) => {
    if (capturedJobs.length > 0) return;
    const url = response.url();
    if (url.includes("/api/jobs/") && response.status() === 200) {
      try {
        const json = await response.json();
        const items = extractItems(json);
        if (items.length > 0) {
          capturedJobs = items.slice(0, 25).map(mapItem);
          logger.info({ count: capturedJobs.length, url }, "QatarLiving: captured from API");
        }
      } catch {
        // not parseable
      }
    }
  });

  try {
    await page.goto(URL, { waitUntil: "networkidle", timeout: 45_000 });
    await page.waitForTimeout(8000);

    if (capturedJobs.length > 0) return capturedJobs;

    // Try extracting from rendered DOM (featured positions, etc.)
    const domJobs = await page.evaluate(() => {
      const results: Array<{ title: string; company: string; link: string }> = [];

      document.querySelectorAll("a[href*='/jobs/']").forEach((a) => {
        const text = a.textContent?.trim();
        if (text && text.length > 3 && text.length < 150) {
          results.push({ title: text, company: "", link: (a as HTMLAnchorElement).href });
        }
      });

      return results;
    });

    if (domJobs.length > 0) {
      const jobs = domJobs.slice(0, 25).map((d) => ({
        title: d.title,
        company: "Qatar Living",
        location: "Doha, Qatar",
        description: "No description available",
        source: "Qatar Living" as const,
        sourceUrl: d.link,
        applyUrl: d.link,
        postedAt: new Date(),
      }));
      logger.info({ count: jobs.length }, "QatarLiving: extracted from DOM");
      return jobs;
    }

    await pw.captureDebug(page, "qatar-living-no-data");
    logger.warn("QatarLiving: no jobs found via API or DOM");
    return [];
  } finally {
    await page.close().catch(() => {});
  }
}

async function tryFetchApi(pw: PlaywrightScraper, url: string): Promise<ScrapedJob[]> {
  const page = await pw.createPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15_000 });
    const text = await page.evaluate(() => document.body.innerText).catch(() => "");
    const json = tryParseJson(text);
    if (!json) return [];
    const items = extractItems(json);
    return items.slice(0, 25).map(mapItem);
  } finally {
    await page.close().catch(() => {});
  }
}

function extractItems(json: any): any[] {
  if (Array.isArray(json)) return json;
  if (json.data && Array.isArray(json.data)) return json.data;
  if (json.jobs && Array.isArray(json.jobs)) return json.jobs;
  if (json.results && Array.isArray(json.results)) return json.results;
  if (json.items && Array.isArray(json.items)) return json.items;
  if (json.featuredJobs && Array.isArray(json.featuredJobs)) return json.featuredJobs;
  return [];
}

function tryParseJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    try {
      const match = text.match(/(\{.*\}|\[.*\])/s);
      return match ? JSON.parse(match[0]) : null;
    } catch {
      return null;
    }
  }
}

function mapItem(item: any): ScrapedJob {
  return {
    title: item.jobTitle ?? item.title ?? item.job_title ?? "Unknown Position",
    company: item.companyName ?? item.company ?? item.company_name ?? "Qatar Living",
    location: item.location ?? item.city ?? "Doha, Qatar",
    description: item.description ?? item.summary ?? item.job_description ?? "No description available",
    source: "Qatar Living",
    sourceUrl: item.applyUrl ?? item.url ?? item.link ?? item.sourceUrl ?? URL,
    applyUrl: item.applyUrl ?? item.url ?? item.link ?? item.sourceUrl ?? URL,
    employmentType: (item.jobTypes ?? [item.employmentType]).filter(Boolean).join(", ") || "Full-Time",
    postedAt: item.postedAt ?? item.created_at ?? item.posted_at ? new Date(item.postedAt ?? item.created_at ?? item.posted_at) : new Date(),
  };
}
