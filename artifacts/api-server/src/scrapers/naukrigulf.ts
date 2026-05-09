import type { ScrapedJob } from "../lib/scraper-engine";

export async function scrapeNaukrigulf(): Promise<ScrapedJob[]> {
  const jobs: ScrapedJob[] = [];

  try {
    const url = "https://www.naukrigulf.com/qatar-jobs";
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) return jobs;

    const html = await response.text();

    const titleRegex = /<a[^>]*class="[^"]*job-title[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    const companyRegex = /<span[^>]*class="[^"]*company-name[^"]*"[^>]*>([\s\S]*?)<\/span>/gi;
    const locationRegex = /<span[^>]*class="[^"]*location[^"]*"[^>]*>([\s\S]*?)<\/span>/gi;
    const salaryRegex = /<span[^>]*class="[^"]*salary[^"]*"[^>]*>([\s\S]*?)<\/span>/gi;
    const descRegex = /<div[^>]*class="[^"]*job-description[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;

    const titles: string[] = [];
    const links: string[] = [];
    const companies: string[] = [];
    const locations: string[] = [];
    const salaries: string[] = [];
    const descs: string[] = [];

    let m;
    while ((m = titleRegex.exec(html)) !== null) {
      links.push(m[1]);
      titles.push(m[2].replace(/<[^>]*>/g, "").trim());
    }
    while ((m = companyRegex.exec(html)) !== null) companies.push(m[1].replace(/<[^>]*>/g, "").trim());
    while ((m = locationRegex.exec(html)) !== null) locations.push(m[1].replace(/<[^>]*>/g, "").trim());
    while ((m = salaryRegex.exec(html)) !== null) salaries.push(m[1].replace(/<[^>]*>/g, "").trim());
    while ((m = descRegex.exec(html)) !== null) descs.push(m[1].replace(/<[^>]*>/g, "").trim());

    const count = Math.min(titles.length, 25);
    for (let i = 0; i < count; i++) {
      const salary = salaries[i] || "";
      const salaryMatch = salary.match(/(\d[\d,]*)\s*-\s*(\d[\d,]*)/);
      const salaryMin = salaryMatch ? parseInt(salaryMatch[1].replace(/,/g, "")) : undefined;
      const salaryMax = salaryMatch ? parseInt(salaryMatch[2].replace(/,/g, "")) : undefined;

      jobs.push({
        title: titles[i] || "Unknown Position",
        company: companies[i] || "Unknown Company",
        location: locations[i] || "Doha, Qatar",
        salary: salary || undefined,
        salaryMin,
        salaryMax,
        salaryCurrency: "QAR",
        description: descs[i] || "No description available",
        source: "Naukri Gulf",
        sourceUrl: links[i] || url,
        applyUrl: links[i] || url,
        postedAt: new Date(),
      });
    }
  } catch (err: any) {
    console.warn("Naukrigulf scraper error:", err.message);
  }

  return jobs;
}
