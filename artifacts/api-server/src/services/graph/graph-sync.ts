import { db, users, profiles, jobs, companies, discoveredCandidates, candidateSources, intentSignals, opportunityGraphEdges, applications, candidateEnrichments } from "@workspace/db";
import { eq, sql, and, desc } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { runCypher } from "../../lib/neo4j";
import { graphBuilder, type NodeLabel } from "./graph-builder";

class GraphSync {
  private syncing = false;

  async syncAll(): Promise<{ candidates: number; employers: number; skills: number; locations: number; certifications: number; industries: number; jobRoles: number; relationships: number }> {
    if (this.syncing) throw new Error("Graph sync already in progress");
    this.syncing = true;

    const counts = { candidates: 0, employers: 0, skills: 0, locations: 0, certifications: 0, industries: 0, jobRoles: 0, relationships: 0 };

    try {
      await graphBuilder.initializeConstraints();

      counts.candidates = await this.syncCandidates();
      counts.employers = await this.syncEmployers();
      counts.skills = await this.syncSkills();
      counts.locations = await this.syncLocations();
      counts.certifications = await this.syncCertifications();
      counts.industries = await this.syncIndustries();
      counts.jobRoles = await this.syncJobRoles();

      counts.relationships = await this.syncRelationships();

      logger.info({ counts }, "Full graph sync completed");
    } catch (err) {
      logger.error({ err }, "Graph sync failed");
      throw err;
    } finally {
      this.syncing = false;
    }

    return counts;
  }

  private async syncCandidates(): Promise<number> {
    const rows = await db.select({
      id: discoveredCandidates.id,
      fullName: discoveredCandidates.fullName,
      email: discoveredCandidates.email,
      headline: discoveredCandidates.headline,
      location: discoveredCandidates.location,
      experienceLevel: discoveredCandidates.experienceLevel,
      industry: discoveredCandidates.industry,
      skills: discoveredCandidates.normalizedSkills,
      certifications: discoveredCandidates.certifications,
      verificationStatus: discoveredCandidates.verificationStatus,
    }).from(discoveredCandidates).where(eq(discoveredCandidates.verificationStatus, "verified"));

    for (const row of rows) {
      await graphBuilder.upsertNode(["Candidate"], {
        id: row.id,
        fullName: row.fullName,
        email: row.email,
        headline: row.headline,
        location: row.location,
        experienceLevel: row.experienceLevel,
        industry: row.industry,
        skills: row.skills,
        certifications: row.certifications,
        verificationStatus: row.verificationStatus,
      });
    }

    const profileRows = await db.select({
      id: users.id,
      fullName: profiles.fullName,
      email: users.email,
      headline: profiles.headline,
      location: profiles.location,
      skills: profiles.skills,
    }).from(users).innerJoin(profiles, eq(profiles.userId, users.id)).where(eq(users.role, "jobseeker")).limit(500);

    for (const row of profileRows) {
      const existingId = `profile_${row.id}`;
      await graphBuilder.upsertNode(["Candidate"], {
        id: existingId,
        fullName: row.fullName,
        email: row.email,
        headline: row.headline,
        location: row.location,
        skills: row.skills,
      });
    }

    return rows.length + profileRows.length;
  }

  private async syncEmployers(): Promise<number> {
    const employerUsers = await db.select({
      id: users.id,
      email: users.email,
    }).from(users).where(eq(users.role, "employer"));

    const allCompanies = await db.select({
      id: companies.id,
      name: companies.name,
      industry: companies.industry,
      location: companies.location,
      website: companies.website,
    }).from(companies);

    const companyMap = new Map(allCompanies.map(c => [c.id, c]));

    for (const emp of employerUsers) {
      await graphBuilder.upsertNode(["Employer"], {
        id: emp.id,
        email: emp.email,
        companyName: emp.email?.split("@")[1] || emp.email,
      });
    }

    for (const company of allCompanies) {
      await graphBuilder.upsertNode(["Employer"], {
        id: `company_${company.id}`,
        name: company.name,
        industry: company.industry,
        location: company.location,
        website: company.website,
      });
    }

    return employerUsers.length + allCompanies.length;
  }

  private async syncSkills(): Promise<number> {
    const skillNames = new Set<string>();

    const discoveredSkills = await db.select({ skills: discoveredCandidates.normalizedSkills })
      .from(discoveredCandidates).limit(200);
    discoveredSkills.forEach(r => (r.skills || []).forEach((s: string) => skillNames.add(s)));

    const profileSkills = await db.select({ skills: profiles.skills })
      .from(profiles).limit(200);
    profileSkills.forEach(r => (r.skills || []).forEach((s: string) => skillNames.add(s)));

    const jobSkills = await db.select({ skills: jobs.skills })
      .from(jobs).limit(200);
    jobSkills.forEach(r => (r.skills || []).forEach((s: string) => skillNames.add(s)));

    for (const name of skillNames) {
      if (name.trim()) {
        await graphBuilder.upsertNode(["Skill"], { name: name.trim().toLowerCase() });
      }
    }

    return skillNames.size;
  }

  private async syncLocations(): Promise<number> {
    const locations = new Set<string>();
    const discovered = await db.select({ location: discoveredCandidates.location }).from(discoveredCandidates).limit(200);
    discovered.forEach(r => { if (r.location) locations.add(r.location); });

    const profileLoc = await db.select({ location: profiles.location }).from(profiles).limit(200);
    profileLoc.forEach(r => { if (r.location) locations.add(r.location); });

    const jobLoc = await db.select({ location: jobs.location }).from(jobs).limit(200);
    jobLoc.forEach(r => { if (r.location) locations.add(r.location); });

    for (const name of locations) {
      await graphBuilder.upsertNode(["Location"], { name });
    }

    return locations.size;
  }

  private async syncCertifications(): Promise<number> {
    const certs = new Set<string>();
    const discovered = await db.select({ certifications: discoveredCandidates.certifications }).from(discoveredCandidates).limit(200);
    discovered.forEach(r => (r.certifications || []).forEach((c: string) => certs.add(c)));

    for (const name of certs) {
      if (name.trim()) {
        await graphBuilder.upsertNode(["Certification"], { name: name.trim() });
      }
    }

    return certs.size;
  }

  private async syncIndustries(): Promise<number> {
    const industries = new Set<string>();
    const fromJobs = await db.select({ industry: jobs.industry }).from(jobs).limit(200);
    fromJobs.forEach(r => { if (r.industry) industries.add(r.industry); });

    const fromDiscovered = await db.select({ industry: discoveredCandidates.industry }).from(discoveredCandidates).limit(200);
    fromDiscovered.forEach(r => { if (r.industry) industries.add(r.industry); });

    const fromCompanies = await db.select({ industry: companies.industry }).from(companies).limit(200);
    fromCompanies.forEach(r => { if (r.industry) industries.add(r.industry); });

    for (const name of industries) {
      await graphBuilder.upsertNode(["Industry"], { name });
    }

    return industries.size;
  }

  private async syncJobRoles(): Promise<number> {
    const roles = new Set<string>();
    const jobTitles = await db.select({ title: jobs.title }).from(jobs).limit(300);
    jobTitles.forEach(r => { if (r.title) roles.add(r.title); });

    for (const name of roles) {
      await graphBuilder.upsertNode(["JobRole"], { name });
    }

    return roles.size;
  }

  private async syncRelationships(): Promise<number> {
    let count = 0;

    const edges = await db.select().from(opportunityGraphEdges).limit(1000);
    for (const edge of edges) {
      const relationMap: Record<string, { relationType: string; fromLabel: NodeLabel; toLabel: NodeLabel; fromKey: string; toKey: string }> = {
        has_skill: { relationType: "HAS_SKILL", fromLabel: "Candidate", toLabel: "Skill", fromKey: "id", toKey: "name" },
        located_in: { relationType: "LOCATED_IN", fromLabel: "Candidate", toLabel: "Location", fromKey: "id", toKey: "name" },
        works_at: { relationType: "WORKED_AT", fromLabel: "Candidate", toLabel: "Employer", fromKey: "id", toKey: "id" },
        certified_in: { relationType: "CERTIFIED_IN", fromLabel: "Candidate", toLabel: "Certification", fromKey: "id", toKey: "name" },
        in_industry: { relationType: "BELONGS_TO", fromLabel: "Candidate", toLabel: "Industry", fromKey: "id", toKey: "name" },
        suited_for: { relationType: "MATCHES", fromLabel: "Candidate", toLabel: "JobRole", fromKey: "id", toKey: "name" },
      };

      const mapping = relationMap[edge.relationType];
      if (!mapping) continue;

      try {
        await graphBuilder.createRelation({
          type: mapping.relationType as any,
          fromLabels: [mapping.fromLabel],
          fromMatch: { [mapping.fromKey]: edge.candidateId },
          toLabels: [mapping.toLabel],
          toMatch: { [mapping.toKey]: edge.relationValue },
          properties: { weight: edge.weight, source: edge.source || "sync" },
        });
        count++;
      } catch (err) {
        logger.debug({ err, edge }, "Failed to sync edge (likely missing node)");
      }
    }

    const intentSignalsData = await db.select({
      id: intentSignals.id,
      candidateId: intentSignals.candidateId,
      signalType: intentSignals.signalType,
    }).from(intentSignals).limit(500);

    for (const signal of intentSignalsData) {
      await graphBuilder.upsertNode(["IntentSignal"], {
        id: signal.id,
        type: signal.signalType,
      });
      try {
        await graphBuilder.createRelation({
          type: "INTERESTED_IN",
          fromLabels: ["Candidate"],
          fromMatch: { id: signal.candidateId },
          toLabels: ["IntentSignal"],
          toMatch: { id: signal.id },
        });
        count++;
      } catch { /* skip */ }
    }

    return count;
  }

  async syncCandidateSkillRelations(candidateId: number, skills: string[]): Promise<number> {
    let count = 0;
    for (const skill of skills) {
      await graphBuilder.upsertNode(["Skill"], { name: skill.trim().toLowerCase() });
      try {
        await graphBuilder.createRelation({
          type: "HAS_SKILL",
          fromLabels: ["Candidate"],
          fromMatch: { id: candidateId },
          toLabels: ["Skill"],
          toMatch: { name: skill.trim().toLowerCase() },
          properties: { weight: 1.0, source: "sync" },
        });
        count++;
      } catch { /* skip */ }
    }
    return count;
  }

  async getSyncStatus(): Promise<{
    lastSyncAt: string | null;
    isSyncing: boolean;
    nodeCounts: Record<string, number>;
  }> {
    const nodeCounts = await graphBuilder.getNodeCount();
    return {
      lastSyncAt: null,
      isSyncing: this.syncing,
      nodeCounts,
    };
  }
}

export const graphSync = new GraphSync();
