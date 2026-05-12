import { Router, type IRouter, type Request, type Response } from "express";
import { db, resources } from "@workspace/db";
import { eq, and, ilike, sql, desc } from "drizzle-orm";

const router: IRouter = Router();

router.post("/seed", async (_req: Request, res: Response) => {
  try {
    const existing = await db.select({ count: sql<number>`count(*)` }).from(resources);
    if (Number(existing[0]?.count ?? 0) > 0) {
      res.json({ ok: true, message: "Resources already seeded" });
      return;
    }
    const seedData = [
      { title: "Qatar Labour Law (Law No. 14 of 2004)", description: "Complete text of Qatar's labour law from the official legal portal", category: "Labor Laws", url: "https://www.almeezan.qa/LawArticles.aspx?LawTreeSectionID=12648&lawId=3961&language=en", featured: true },
      { title: "UAE Labour Law (Federal Decree-Law No. 33 of 2021)", description: "Official UAE employment law regulations from MOHRE", category: "Labor Laws", url: "https://mohre.gov.ae/assets/download/8c8d4e6/Cabinet%20Resolution_Executive%20Regulations%20Decree-Law%20No.%2033%20of%202021.pdf.aspx", featured: true },
      { title: "Saudi Arabia Labour Law", description: "Official labor law of the Kingdom of Saudi Arabia from HRSD", category: "Labor Laws", url: "https://www.hrsd.gov.sa/sites/default/files/2023-02/Labor.pdf", featured: true },
      { title: "Bahrain Labour Law", description: "Labour market regulations from Bahrain's LMRA", category: "Labor Laws", url: "https://www.lmra.gov.bh/files/cms/shared/file/labour%20law.pdf", featured: false },
      { title: "Oman Labour Law (Royal Decree 53/2023)", description: "Official Oman labour law text", category: "Labor Laws", url: "https://www.mol.gov.om/Laborlaw", featured: false },
      { title: "UAE Know Your Rights - Worker Guide", description: "MOHRE's official guide for worker rights in the UAE", category: "Labor Laws", url: "https://mohre.gov.ae/assets/download/618ff6ec/Know%20Your%20Rights%20-%20English_638924921038367080.pdf.aspx", featured: true },
      { title: "Qatar Ministry of Labour", description: "Official portal for Qatar labour services, laws, and e-services", category: "Government", url: "https://www.mol.gov.qa/En/", featured: true },
      { title: "UAE MOHRE - Ministry of Human Resources", description: "Official UAE ministry for employment relations and labour market", category: "Government", url: "https://www.mohre.gov.ae/en/home", featured: true },
      { title: "Saudi HRSD - Ministry of Human Resources", description: "Official Saudi ministry for labour and social development", category: "Government", url: "https://www.hrsd.gov.sa/en", featured: true },
      { title: "Kuwait Public Authority for Manpower", description: "Official Kuwait manpower authority", category: "Government", url: "https://www.manpower.gov.kw/", featured: false },
      { title: "Bahrain LMRA", description: "Bahrain Labour Market Regulatory Authority", category: "Government", url: "https://lmra.gov.bh/en/home", featured: false },
      { title: "Oman Ministry of Labour", description: "Official Oman ministry for employment and labour", category: "Government", url: "https://mol.gov.om/", featured: false },
      { title: "GulfTalent Salary Guide", description: "Salary benchmarks and market trends for Gulf region jobs", category: "Career Tools", url: "https://www.gulftalent.com/salaries", featured: true },
      { title: "Bayt.com - Gulf Region Jobs", description: "Leading job portal for the Middle East and GCC", category: "Job Portals", url: "https://www.bayt.com/", featured: true },
      { title: "NaukriGulf", description: "Popular job portal for Gulf region professionals", category: "Job Portals", url: "https://www.naukrigulf.com/", featured: false },
      { title: "Jobscan - ATS Resume Checker", description: "Check if your resume passes Applicant Tracking Systems", category: "AI Tools", url: "https://www.jobscan.co/", featured: true },
      { title: "Kickresume - AI Resume Builder", description: "AI-powered resume builder and checker", category: "AI Tools", url: "https://www.kickresume.com/en/", featured: false },
      { title: "Zety - Resume Builder", description: "Professional resume builder with AI assistance", category: "AI Tools", url: "https://zety.com/resume-builder", featured: false },
      { title: "Canva - Free Resume Templates", description: "Professional resume templates you can customize", category: "Downloads", url: "https://www.canva.com/resumes/templates/", featured: true },
      { title: "Microsoft Create - Resume Templates", description: "Free resume and cover letter templates from Microsoft", category: "Downloads", url: "https://create.microsoft.com/en-us/grow-a-business", featured: false },
      { title: "Introduction to Front-End Development (Meta)", description: "Free Coursera course - learn HTML, CSS, and React", category: "Learning Paths", url: "https://www.coursera.org/learn/introduction-to-front-end-development?specialization=meta-front-end-developer", featured: true },
      { title: "Google Cybersecurity Certificate", description: "Professional certificate in cybersecurity on Coursera", category: "Learning Paths", url: "https://www.coursera.org/google-certificates/google-cybersecurity", featured: true },
      { title: "Google AI Essentials", description: "Learn AI fundamentals with Google on Coursera", category: "Learning Paths", url: "https://coursera.org/learn/google-ai-essentials", featured: false },
      { title: "edX - Free AI Courses", description: "Free AI and machine learning courses from top universities", category: "Learning Paths", url: "https://www.edx.org/courses?q=free+ai+courses", featured: false },
      { title: "NEBOSH IGC - Gulf Construction Safety", description: "Most required HSE certification for GCC construction jobs", category: "Learning Paths", url: "https://www.smartqhse.com/safety-blog/best-hse-certifications-gcc-professionals", featured: false },
      { title: "Migrant-Rights.org", description: "Migrant worker rights information and resources for the Gulf", category: "Worker Rights", url: "https://www.migrant-rights.org/", featured: true },
      { title: "MRRORS - Migrant Rights Research", description: "Research repository on migrant worker rights in the Gulf", category: "Worker Rights", url: "https://www.mrrors.org/", featured: false },
      { title: "Indian Embassy Qatar - Working Abroad", description: "Indian embassy resources for workers in Qatar", category: "Embassy", url: "https://www.indianembassyqatar.gov.in/working_abroad", featured: true },
      { title: "MADAD - Indian Government Portal", description: "Indian government grievance portal for overseas workers", category: "Embassy", url: "https://www.madad.gov.in", featured: false },
      { title: "Philippine Migrant Workers Office Qatar", description: "MWO Qatar - support for Filipino workers in Qatar", category: "Embassy", url: "https://www.mwoqatar.org/", featured: false },
      { title: "UAE Labour Law - 10 Things Employers Must Know", description: "YouTube explainer on UAE Labour Law 2026", category: "Videos", url: "https://www.youtube.com/watch?v=bPKPJW3GAOw", featured: false },
      { title: "Gulf Career Hunt YouTube Channel", description: "Tips and guides for landing jobs in the Gulf region", category: "Videos", url: "https://www.youtube.com/@GulfCareerHunt", featured: false },
      { title: "Coalition on Labor Justice for Migrants in the Gulf", description: "NGO coalition advocating for migrant worker rights in GCC", category: "Worker Rights", url: "https://laborjusticegulfmigrants.org/", featured: false },
    ];
    for (const item of seedData) {
      await db.insert(resources).values(item);
    }
    res.status(201).json({ ok: true, message: `Seeded ${seedData.length} resources` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const { category, search, featured, page = "1", limit = "20" } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    const conditions: any[] = [eq(resources.status, "active")];

    if (category && category !== "All") {
      conditions.push(eq(resources.category, category));
    }

    if (search) {
      conditions.push(ilike(resources.title, `%${search}%`));
    }

    if (featured === "true") {
      conditions.push(eq(resources.featured, true));
    }

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(resources)
      .where(and(...conditions));

    const rows = await db
      .select()
      .from(resources)
      .where(and(...conditions))
      .orderBy(desc(resources.featured), desc(resources.createdAt))
      .limit(limitNum)
      .offset(offset);

    res.json({
      resources: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: Number(total),
        totalPages: Math.ceil(Number(total) / limitNum),
        hasMore: offset + limitNum < Number(total),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

export default router;
