import type { ScrapedJob } from "../lib/scraper-engine";

export async function scrapeGulfTalent(): Promise<ScrapedJob[]> {
  const jobs: ScrapedJob[] = [];

  try {
    const url = "https://www.gulftalent.com/qatar/jobs";
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) return jobs;

    const html = await response.text();

    const jobRegex = /<div[^>]*class="[^"]*job-listing[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi;
    const cards: string[] = [];
    let m;
    while ((m = jobRegex.exec(html)) !== null) cards.push(m[1]);

    for (const card of cards.slice(0, 25)) {
      const titleMatch = card.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i);
      const companyMatch = card.match(/<div[^>]*class="[^"]*company[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      const locationMatch = card.match(/<div[^>]*class="[^"]*location[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      const descMatch = card.match(/<p[^>]*>([\s\S]*?)<\/p>/i);

      jobs.push({
        title: titleMatch ? titleMatch[1].replace(/<[^>]*>/g, "").trim() : "Unknown Position",
        company: companyMatch ? companyMatch[1].replace(/<[^>]*>/g, "").trim() : "Unknown",
        location: locationMatch ? locationMatch[1].replace(/<[^>]*>/g, "").trim() : "Qatar",
        description: descMatch ? descMatch[1].trim() : "No description available",
        source: "GulfTalent",
        sourceUrl: url,
        applyUrl: url,
        postedAt: new Date(),
      });
    }
  } catch (err: any) {
    console.warn("GulfTalent scraper error:", err.message);
  }

  return jobs;
}
