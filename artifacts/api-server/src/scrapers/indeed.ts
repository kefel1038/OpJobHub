import type { ScrapedJob } from "../lib/scraper-engine";

export async function scrapeIndeedQatar(): Promise<ScrapedJob[]> {
  const jobs: ScrapedJob[] = [];

  try {
    const url = "https://qa.indeed.com/jobs?q=&l=Qatar";
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) return jobs;

    const html = await response.text();

    const titleRegex = /<h2[^>]*class="[^"]*jobTitle[^"]*"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/gi;
    const companyRegex = /<span[^>]*class="[^"]*companyName[^"]*"[^>]*>([\s\S]*?)<\/span>/gi;
    const locationRegex = /<div[^>]*class="[^"]*companyLocation[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    const salaryRegex = /<div[^>]*class="[^"]*salary-snippet[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    const descRegex = /<div[^>]*class="[^"]*job-snippet[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    const linkRegex = /<a[^>]*class="[^"]*jcs-JobTitle[^"]*"[^>]*href="([^"]*)"[^>]*>/gi;

    const titles: string[] = [];
    const companies: string[] = [];
    const locations: string[] = [];
    const salaries: string[] = [];
    const descs: string[] = [];
    const links: string[] = [];

    let m;
    while ((m = titleRegex.exec(html)) !== null) titles.push(m[1].replace(/<[^>]*>/g, "").trim());
    while ((m = companyRegex.exec(html)) !== null) companies.push(m[1].replace(/<[^>]*>/g, "").trim());
    while ((m = locationRegex.exec(html)) !== null) locations.push(m[1].replace(/<[^>]*>/g, "").trim());
    while ((m = salaryRegex.exec(html)) !== null) salaries.push(m[1].replace(/<[^>]*>/g, "").trim());
    while ((m = descRegex.exec(html)) !== null) descs.push(m[1].replace(/<[^>]*>/g, "").trim());
    while ((m = linkRegex.exec(html)) !== null) links.push(m[1].trim());

    const count = Math.min(titles.length, 25);
    for (let i = 0; i < count; i++) {
      const salary = salaries[i] || "";
      const salaryMatch = salary.match(/(\d[\d,]*)/g);
      const salaryMin = salaryMatch ? parseInt(salaryMatch[0].replace(/,/g, "")) : undefined;
      const salaryMax = salaryMatch && salaryMatch[1] ? parseInt(salaryMatch[1].replace(/,/g, "")) : undefined;

      jobs.push({
        title: titles[i] || "Unknown Position",
        company: companies[i] || "Unknown Company",
        location: locations[i] || "Qatar",
        salary: salaries[i] || undefined,
        salaryMin,
        salaryMax,
        salaryCurrency: "QAR",
        description: descs[i] || "No description available",
        source: "Indeed Qatar",
        sourceUrl: links[i] ? `https://qa.indeed.com${links[i]}` : url,
        applyUrl: links[i] ? `https://qa.indeed.com${links[i]}` : url,
        postedAt: new Date(),
      });
    }
  } catch (err: any) {
    console.warn("Indeed Qatar scraper error:", err.message);
  }

  return jobs;
}
