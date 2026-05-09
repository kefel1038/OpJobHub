import type { ScrapedJob } from "../lib/scraper-engine";

export interface ScraperDefinition {
  name: string;
  displayName: string;
  scrape: () => Promise<ScrapedJob[]>;
}

export { scrapeBaytQatar } from "./bayt";
export { scrapeQatarLiving } from "./qatar-living";
export { scrapeTanqeeb } from "./tanqeeb";
export { scrapeNaukrigulf } from "./naukrigulf";
export { scrapeGulfTalent } from "./gulf-talent";
export { scrapeIndeedQatar } from "./indeed";

export const allScrapers: ScraperDefinition[] = [
  { name: "bayt", displayName: "Bayt Qatar", scrape: scrapeBaytQatar },
  { name: "qatar-living", displayName: "Qatar Living", scrape: scrapeQatarLiving },
  { name: "tanqeeb", displayName: "Tanqeeb Qatar", scrape: scrapeTanqeeb },
  { name: "naukrigulf", displayName: "Naukri Gulf", scrape: scrapeNaukrigulf },
  { name: "gulf-talent", displayName: "GulfTalent", scrape: scrapeGulfTalent },
  { name: "indeed", displayName: "Indeed Qatar", scrape: scrapeIndeedQatar },
];
