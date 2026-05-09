import type { ScrapedJob } from "../lib/scraper-engine";

export async function scrapeTanqeeb(): Promise<ScrapedJob[]> {
  const jobs: ScrapedJob[] = [];

  try {
    const url = "https://www.tanqeeb.com/qatar-jobs";
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) return jobs;

    const html = await response.text();

    const jobCards = html.match(/<div[^>]*class="[^"]*job-card[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi) || [];

    for (const card of jobCards.slice(0, 25)) {
      const titleMatch = card.match(/<h[23][^>]*class="[^"]*job-title[^"]*"[^>]*>([\s\S]*?)<\/h[23]>/i);
      const companyMatch = card.match(/<div[^>]*class="[^"]*company[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      const locationMatch = card.match(/<div[^>]*class="[^"]*location[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      const descMatch = card.match(/<p[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
      const linkMatch = card.match(/<a[^>]*href="([^"]*)"[^>]*class="[^"]*apply[^"]*"/i);

      jobs.push({
        title: titleMatch ? titleMatch[1].replace(/<[^>]*>/g, "").trim() : "Unknown Position",
        company: companyMatch ? companyMatch[1].replace(/<[^>]*>/g, "").trim() : "Unknown",
        location: locationMatch ? locationMatch[1].replace(/<[^>]*>/g, "").trim() : "Doha, Qatar",
        description: descMatch ? descMatch[1].replace(/<[^>]*>/g, "").trim() : "No description available",
        source: "Tanqeeb",
        sourceUrl: linkMatch ? `https://www.tanqeeb.com${linkMatch[1]}` : url,
        applyUrl: linkMatch ? `https://www.tanqeeb.com${linkMatch[1]}` : url,
        postedAt: new Date(),
      });
    }
  } catch (err: any) {
    console.warn("Tanqeeb scraper error:", err.message);
  }

  return jobs;
}
