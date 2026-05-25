import type { ScrapedJob } from "../lib/scraper-engine";
import { scrapeBaytQatar } from "./bayt";
import { scrapeQatarLiving } from "./qatar-living";
import { scrapeTanqeeb } from "./tanqeeb";
import { scrapeNaukrigulf } from "./naukrigulf";
import { scrapeGulfTalent } from "./gulf-talent";
import { scrapeIndeedQatar } from "./indeed";
import { scrapeMzadQatar } from "./mzadqatar";
import { scrapeEl7far } from "./el7far";

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
  scrapeMzadQatar,
  scrapeEl7far,
};

export const allScrapers: ScraperDefinition[] = [
  { name: "bayt", displayName: "Bayt Qatar", scrape: scrapeBaytQatar },
  { name: "qatar-living", displayName: "Qatar Living", scrape: scrapeQatarLiving },
  { name: "tanqeeb", displayName: "Tanqeeb Qatar", scrape: scrapeTanqeeb },
  { name: "naukrigulf", displayName: "Naukri Gulf", scrape: scrapeNaukrigulf },
  { name: "gulf-talent", displayName: "GulfTalent", scrape: scrapeGulfTalent },
  { name: "indeed", displayName: "Indeed Qatar", scrape: scrapeIndeedQatar },
  { name: "mzad-qatar", displayName: "Mzad Qatar", scrape: scrapeMzadQatar },
  { name: "el7far", displayName: "El7far", scrape: scrapeEl7far },
];
