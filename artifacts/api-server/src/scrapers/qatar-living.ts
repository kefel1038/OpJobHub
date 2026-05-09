import type { ScrapedJob } from "../lib/scraper-engine";

export async function scrapeQatarLiving(): Promise<ScrapedJob[]> {
  const jobs: ScrapedJob[] = [];

  try {
    const url = "https://www.qatarliving.com/jobs";
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) return jobs;

    const html = await response.text();

    const titleRegex = /<a[^>]*class="[^"]*job-title[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    const descRegex = /<div[^>]*class="[^"]*job-description[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    const metaRegex = /<div[^>]*class="[^"]*job-meta[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;

    const matches: Array<{ title: string; url: string; desc: string; meta: string }> = [];
    const titles: string[] = [];
    const links: string[] = [];

    let m;
    while ((m = titleRegex.exec(html)) !== null) {
      links.push(m[1].trim());
      titles.push(m[2].replace(/<[^>]*>/g, "").trim());
    }

    const descs: string[] = [];
    while ((m = descRegex.exec(html)) !== null) {
      descs.push(m[1].replace(/<[^>]*>/g, "").trim());
    }

    const metas: string[] = [];
    while ((m = metaRegex.exec(html)) !== null) {
      metas.push(m[1].replace(/<[^>]*>/g, "").trim());
    }

    const count = Math.min(titles.length, 25);
    for (let i = 0; i < count; i++) {
      jobs.push({
        title: titles[i] || "Unknown Position",
        company: "Qatar Living",
        location: "Doha, Qatar",
        description: descs[i] || metas[i] || "No description available",
        source: "Qatar Living",
        sourceUrl: links[i] ? `https://www.qatarliving.com${links[i]}` : url,
        applyUrl: links[i] ? `https://www.qatarliving.com${links[i]}` : url,
        postedAt: new Date(),
      });
    }
  } catch (err: any) {
    console.warn("Qatar Living scraper error:", err.message);
  }

  return jobs;
}
