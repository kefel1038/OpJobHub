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

    const domJobs = await page.evaluate(() => {
      const extractCompany = (lines: string[], title: string): string | null => {
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === title || trimmed.length > 60) continue;
          if (trimmed.match(/^(at|by|@)\s+/i)) return trimmed.replace(/^(at|by|@)\s+/i, "").trim();
        }
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === title || trimmed.length > 60) continue;
          if (trimmed.match(/^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/) && !trimmed.match(/(Doha|Qatar)/i)) {
            return trimmed;
          }
        }
        return null;
      };

      const results: Array<{
        title: string;
        company: string;
        link: string;
        location: string;
        salary: string;
        type: string;
      }> = [];

      const seen = new Set<string>();

      document.querySelectorAll("a[href*='/job']").forEach((a) => {
        const link = (a as HTMLAnchorElement).href;
        if (seen.has(link)) return;
        const text = a.textContent?.trim();
        if (!text || text.length < 4 || text.length > 200) return;
        seen.add(link);

        const card = a.closest("div, article, li, tr") as HTMLElement | null;
        const cardText = card?.innerText || "";

        const lines = cardText.split("\n").map((l) => l.trim()).filter(Boolean);

        const locationMatch = cardText.match(/Doha|Qatar|Al\s+\w+/i);
        const salaryMatch = cardText.match(/QAR\s*[\d,]+|[\d,]+\s*QAR|QR\s*[\d,]+/i);
        const typeMatch = cardText.match(/Full.?Time|Part.?Time|Contract|Temporary/i);

        results.push({
          title: text,
          company: extractCompany(lines, text) || "Qatar Living",
          link,
          location: locationMatch?.[0] || "Doha, Qatar",
          salary: salaryMatch?.[0] || "",
          type: typeMatch?.[0] || "Full-Time",
        });
      });

      return results;
    });

    if (domJobs.length > 0) {
      const jobs = domJobs.slice(0, 25).map((d) => ({
        title: d.title,
        company: d.company,
        location: d.location,
        salary: d.salary || undefined,
        description: `Position: ${d.title} at ${d.company}. View details and apply on the employer website.`,
        source: "Qatar Living" as const,
        sourceUrl: d.link,
        applyUrl: d.link,
        employmentType: d.type,
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
