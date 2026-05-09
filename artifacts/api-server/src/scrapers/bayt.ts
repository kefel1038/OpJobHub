import type { ScrapedJob } from "../lib/scraper-engine";

export async function scrapeBaytQatar(): Promise<ScrapedJob[]> {
  const jobs: ScrapedJob[] = [];

  try {
    const url = "https://www.bayt.com/en/qatar/jobs/";
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      console.warn(`Bayt returned status ${response.status}`);
      return jobs;
    }

    const html = await response.text();

    const titleRegex = /<h2[^>]*class="[^"]*job-title[^"]*"[^>]*>([\s\S]*?)<\/h2>/gi;
    const companyRegex = /<b[^>]*class="[^"]*company-name[^"]*"[^>]*>([\s\S]*?)<\/b>/gi;
    const locationRegex = /<span[^>]*class="[^"]*location[^"]*"[^>]*>([\s\S]*?)<\/span>/gi;
    const descRegex = /<p[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/p>/gi;
    const linkRegex = /<a[^>]*class="[^"]*job-link[^"]*"[^>]*href="([^"]*)"[^>]*>/gi;

    const titles: string[] = [];
    const companies: string[] = [];
    const locations: string[] = [];
    const descriptions: string[] = [];
    const links: string[] = [];

    let m;
    while ((m = titleRegex.exec(html)) !== null) titles.push(m[1].replace(/<[^>]*>/g, "").trim());
    while ((m = companyRegex.exec(html)) !== null) companies.push(m[1].replace(/<[^>]*>/g, "").trim());
    while ((m = locationRegex.exec(html)) !== null) locations.push(m[1].replace(/<[^>]*>/g, "").trim());
    while ((m = descRegex.exec(html)) !== null) descriptions.push(m[1].replace(/<[^>]*>/g, "").trim());
    while ((m = linkRegex.exec(html)) !== null) links.push(m[1].trim());

    const count = Math.min(titles.length, 25);
    for (let i = 0; i < count; i++) {
      jobs.push({
        title: titles[i] || "Unknown Position",
        company: companies[i] || "Unknown Company",
        location: locations[i] || "Doha, Qatar",
        description: descriptions[i] || "No description available",
        source: "Bayt Qatar",
        sourceUrl: links[i] ? `https://www.bayt.com${links[i]}` : url,
        applyUrl: links[i] ? `https://www.bayt.com${links[i]}` : url,
        employmentType: "Full-Time",
        postedAt: new Date(),
      });
    }
  } catch (err: any) {
    console.warn("Bayt scraper error:", err.message);
  }

  return jobs;
}
