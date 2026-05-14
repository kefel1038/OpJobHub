import type { PlasmoCSConfig } from "plasmo";

export const config: PlasmoCSConfig = {
  matches: ["https://www.linkedin.com/in/*"],
  run_at: "document_idle",
};

interface CandidateProfile {
  name: string;
  headline: string;
  location: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    school: string;
    year: string;
  }>;
  profileUrl: string;
  photoUrl?: string;
}

function waitForElement(selector: string, timeout = 5000): Promise<Element | null> {
  return new Promise((resolve) => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);
    const observer = new MutationObserver(() => {
      const found = document.querySelector(selector);
      if (found) {
        observer.disconnect();
        resolve(found);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

function extractName(): string {
  const h1 = document.querySelector("h1");
  return h1?.textContent?.trim() || "";
}

function extractHeadline(): string {
  const headline = document.querySelector(".text-body-medium.break-words");
  return headline?.textContent?.trim() || "";
}

function extractLocation(): string {
  const loc = document.querySelector(".text-body-small.inline");
  return loc?.textContent?.trim() || "";
}

function extractSkills(): string[] {
  const pills = document.querySelectorAll("span[aria-describedby*=skill]");
  if (pills.length > 0) {
    return Array.from(pills).map((p) => p.textContent?.trim() || "").filter(Boolean);
  }
  const skillItems = document.querySelectorAll(".skills__list li span");
  return Array.from(skillItems).map((s) => s.textContent?.trim() || "").filter(Boolean);
}

function extractExperience() {
  const items: CandidateProfile["experience"] = [];
  const sections = document.querySelectorAll("#experience ~ .pvs-list__outer-container li.pvs-list__item");
  sections.forEach((li) => {
    const title = li.querySelector("span[aria-hidden=true]")?.textContent?.trim() || "";
    const company = li.querySelector(".t-normal")?.textContent?.trim() || "";
    const duration = li.querySelector(".t-black--light")?.textContent?.trim() || "";
    const description = li.querySelector(".display-flex span[aria-hidden=true]")?.textContent?.trim() || "";
    if (title) items.push({ title, company, duration, description });
  });
  return items;
}

function extractEducation() {
  const items: CandidateProfile["education"] = [];
  const eduItems = document.querySelectorAll("#education ~ .pvs-list__outer-container li.pvs-list__item");
  eduItems.forEach((li) => {
    const degree = li.querySelector("span[aria-hidden=true]")?.textContent?.trim() || "";
    const school = li.querySelector(".t-normal")?.textContent?.trim() || "";
    const year = li.querySelector(".t-black--light")?.textContent?.trim() || "";
    if (degree) items.push({ degree, school, year });
  });
  return items;
}

function extractPhotoUrl(): string {
  const img = document.querySelector("img.profile-photo-edit__preview");
  return img?.getAttribute("src") || "";
}

async function extractProfile(): Promise<CandidateProfile> {
  await waitForElement("h1", 3000);

  return {
    name: extractName(),
    headline: extractHeadline(),
    location: extractLocation(),
    skills: extractSkills(),
    experience: extractExperience(),
    education: extractEducation(),
    profileUrl: window.location.href.split("?")[0],
    photoUrl: extractPhotoUrl(),
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "EXTRACT_PROFILE") {
    extractProfile().then((profile) => {
      sendResponse({ profile });
    });
    return true;
  }
});
