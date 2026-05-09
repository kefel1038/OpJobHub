import type { ScrapedJob } from "../lib/scraper-engine";
import { scrapeBaytQatar } from "./bayt";
import { scrapeQatarLiving } from "./qatar-living";
import { scrapeTanqeeb } from "./tanqeeb";
import { scrapeNaukrigulf } from "./naukrigulf";
import { scrapeGulfTalent } from "./gulf-talent";
import { scrapeIndeedQatar } from "./indeed";

export interface ScraperDefinition {
  name: string;
  displayName: string;
  scrape: () => Promise<ScrapedJob[]>;
}

export {
  scrapeBaytQatar,
  scrapeQatarLiving,
  scrapeTanqeeb,
  scrapeNaukrigulf,
  scrapeGulfTalent,
  scrapeIndeedQatar,
};

export const allScrapers: ScraperDefinition[] = [
  { name: "bayt", displayName: "Bayt Qatar", scrape: scrapeBaytQatar },
  { name: "qatar-living", displayName: "Qatar Living", scrape: scrapeQatarLiving },
  { name: "tanqeeb", displayName: "Tanqeeb Qatar", scrape: scrapeTanqeeb },
  { name: "naukrigulf", displayName: "Naukri Gulf", scrape: scrapeNaukrigulf },
  { name: "gulf-talent", displayName: "GulfTalent", scrape: scrapeGulfTalent },
  { name: "indeed", displayName: "Indeed Qatar", scrape: scrapeIndeedQatar },
];
