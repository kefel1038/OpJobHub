import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { logger } from "./logger";
import type { ScrapedJob } from "./scraper-engine";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export interface NavigationOptions {
  waitUntil?: "load" | "domcontentloaded" | "networkidle";
  timeout?: number;
  retries?: number;
}

const STEALTH_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36";

export class PlaywrightScraper {
  private static instance: PlaywrightScraper;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private debugDir: string | null = null;

  static getInstance(): PlaywrightScraper {
    if (!PlaywrightScraper.instance) {
      PlaywrightScraper.instance = new PlaywrightScraper();
    }
    return PlaywrightScraper.instance;
  }

  async init(): Promise<void> {
    if (this.browser) return;
    this.browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-http2",
        "--disable-blink-features=AutomationControlled",
        "--disable-features=IsolateOrigins,site-per-process",
      ],
    });
    this.context = await this.browser.newContext({
      userAgent: STEALTH_UA,
      viewport: { width: 1920, height: 1080 },
      locale: "en-US",
      timezoneId: "Asia/Qatar",
      geolocation: { latitude: 25.276987, longitude: 51.520008 },
      permissions: ["geolocation"],
      extraHTTPHeaders: {
        "Accept-Language": "en-US,en;q=0.9",
        "sec-ch-ua": '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
      },
    });

    const debugPath = process.env.SCRAPER_DEBUG_DIR;
    if (debugPath) {
      this.debugDir = debugPath;
      await mkdir(debugPath, { recursive: true });
    }
  }

  async navigate(
    url: string,
    options?: NavigationOptions,
  ): Promise<Page> {
    const page = await this.context!.newPage();
    await this.doNavigate(page, url, options);
    return page;
  }

  async createPage(): Promise<Page> {
    return await this.context!.newPage();
  }

  private async doNavigate(
    page: Page,
    url: string,
    options?: NavigationOptions,
  ): Promise<void> {
    const maxRetries = options?.retries ?? 2;
    let lastError: Error | null = null;
    page.setDefaultTimeout(options?.timeout ?? 30_000);
    page.setDefaultNavigationTimeout(options?.timeout ?? 30_000);

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        await page.goto(url, {
          waitUntil: options?.waitUntil ?? "networkidle",
          timeout: options?.timeout ?? 30_000,
        });

        await page.waitForLoadState("domcontentloaded");

        const hasContent = await page.evaluate(() => document.body.innerText.length > 0).catch(() => false);
        if (!hasContent) {
          throw new Error("Page loaded but body is empty — possible bot block");
        }

        return;
      } catch (err: any) {
        lastError = err;
        const status = page.url() !== "about:blank"
          ? await page.evaluate(() => document.readyState).catch(() => "unknown")
          : "blank";

        logger.warn(
          { url, attempt, maxRetries, error: err.message, readyState: status },
          `Navigation attempt ${attempt}/${maxRetries + 1} failed`,
        );

        await this.captureDebug(page, `nav-fail-${attempt}`).catch(() => {});

        if (attempt <= maxRetries) {
          const delay = Math.min(2000 * attempt, 10_000);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    throw lastError ?? new Error(`Failed to navigate to ${url}`);
  }

  async extractJobs(
    page: Page,
    cardSelector: string,
    fields: Record<string, string>,
    source: string,
    sourceUrl: string,
    options?: {
      maxJobs?: number;
      waitForCards?: boolean;
      cardTimeout?: number;
    },
  ): Promise<ScrapedJob[]> {
    if (options?.waitForCards ?? true) {
      try {
        await page.waitForSelector(cardSelector, {
          timeout: options?.cardTimeout ?? 10_000,
        });
      } catch {
        logger.warn(
          { source, cardSelector },
          "Card selector did not appear within timeout",
        );
        await this.captureDebug(page, `${source}-no-cards`);
        return [];
      }
    }

    let raw: Array<Record<string, string>>;
    try {
      raw = await page.evaluate(
        ({ cardSelector, fields, maxJobs }) => {
        const cards = document.querySelectorAll(cardSelector);
        const results: Array<Record<string, string>> = [];

        const max = maxJobs ?? 25;

        for (let i = 0; i < Math.min(cards.length, max); i++) {
          const card = cards[i];
          const row: Record<string, string> = {};
          for (const [key, sel] of Object.entries(fields)) {
            if (!sel) { row[key] = ""; continue; }
            const el = card.querySelector(sel as string);
            if (!el) { row[key] = ""; continue; }
            if (key === "link") {
              row[key] = (el as HTMLAnchorElement).href || el.getAttribute("href") || "";
            } else {
              row[key] = (el as HTMLElement).textContent?.trim() ?? "";
            }
          }
          results.push(row);
        }

        return results;
      },
      { cardSelector, fields, maxJobs: options?.maxJobs ?? 25 },
    );
    } catch (err: any) {
      logger.warn({ source, error: err.message }, "Failed to evaluate job cards");
      await this.captureDebug(page, `${source}-evaluate-fail`);
      return [];
    }

    logger.info({ source, found: raw.length }, "Extracted raw job cards");

    const jobs: ScrapedJob[] = raw.map((r) => ({
      title: r.title || "Unknown Position",
      company: r.company || source,
      location: r.location || "Doha, Qatar",
      salary: r.salary || undefined,
      salaryMin: r.salaryMin ? parseInt(r.salaryMin.replace(/[^0-9]/g, "")) : undefined,
      salaryMax: r.salaryMax ? parseInt(r.salaryMax.replace(/[^0-9]/g, "")) : undefined,
      salaryCurrency: "QAR",
      description: r.description || r.summary || "No description available",
      source,
      sourceUrl: r.link || sourceUrl,
      applyUrl: r.link || sourceUrl,
      employmentType: "Full-Time",
      postedAt: new Date(),
    }));

    return jobs;
  }

  async captureDebug(page: Page, name: string): Promise<void> {
    if (!this.debugDir) return;
    try {
      const timestamp = Date.now();
      const base = path.join(this.debugDir, `${name}-${timestamp}`);

      await page.screenshot({ path: `${base}.png`, fullPage: true });
      const html = await page.content();
      await writeFile(`${base}.html`, html, "utf-8");

      logger.info({ path: `${base}.png` }, "Debug capture saved");
    } catch (err: any) {
      logger.warn({ error: err.message }, "Failed to capture debug output");
    }
  }

  async close(): Promise<void> {
    try {
      await this.context?.close();
      await this.browser?.close();
    } catch (err: any) {
      logger.warn({ error: err.message }, "Error closing browser");
    }
    this.browser = null;
    this.context = null;
  }
}
