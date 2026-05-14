#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { searchJobs, getJob, getMarketInsights, matchByProfile, getEmployerStats, getEmployerAIMatches } from "./api.js";

const server = new Server(
  { name: "opjobhub-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

// ─── Tool Definitions ─────────────────────────────────────────────

const tools: Tool[] = [
  {
    name: "opjobhub_search_jobs",
    description: "Search for job listings across the Gulf/Middle East market. Supports filtering by keyword, location, industry, employment type, experience level, visa sponsorship, and remote work.",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Search query (job title, keyword, company)" },
        location: { type: "string", description: "City or country (e.g., Doha, Qatar, Dubai, Riyadh)" },
        industry: { type: "string", description: "Industry filter (e.g., Technology, Healthcare, Construction)" },
        employmentType: { type: "string", description: "Employment type (Full-Time, Part-Time, Contract, Freelance)", enum: ["Full-Time", "Part-Time", "Contract", "Freelance"] },
        experienceLevel: { type: "string", description: "Experience level (Entry, Mid, Senior, Executive)" },
        visaSponsored: { type: "boolean", description: "Only show jobs offering visa sponsorship" },
        remote: { type: "boolean", description: "Only show remote jobs" },
        limit: { type: "number", description: "Maximum results to return (default 10, max 50)" },
      },
    },
  },
  {
    name: "opjobhub_get_job",
    description: "Get detailed information about a specific job listing by ID, including full description, requirements, responsibilities, and benefits.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "number", description: "Job ID to look up" },
      },
      required: ["id"],
    },
  },
  {
    name: "opjobhub_match_skills",
    description: "Match a candidate's skills, experience, and location against active Gulf/Market job listings. Returns ranked matches with scores, aligned skills, and skill gaps.",
    inputSchema: {
      type: "object",
      properties: {
        skills: {
          type: "array",
          items: { type: "string" },
          description: "Array of candidate skills (e.g., React, Python, Project Management)",
        },
        experience: {
          type: "string",
          description: "Candidate's experience level (Entry, Mid, Senior, Executive)",
        },
        location: {
          type: "string",
          description: "Candidate's preferred location (e.g., Doha, Qatar, Remote)",
        },
      },
      required: ["skills"],
    },
  },
  {
    name: "opjobhub_market_insights",
    description: "Get labor market intelligence: trending skills, salary data, demand levels, and skill gap analysis for the Gulf/Middle East job market.",
    inputSchema: {
      type: "object",
      properties: {
        skills: {
          type: "array",
          items: { type: "string" },
          description: "Your current skills to analyze against market demand",
        },
        targetRole: {
          type: "string",
          description: "Target job role for targeted market analysis (e.g., DevOps Engineer, Data Scientist)",
        },
      },
    },
  },
  {
    name: "opjobhub_employer_stats",
    description: "Get employer dashboard statistics: total active jobs, total applicants, interviews this week, hires this month, and pipeline breakdown. Requires API token authentication.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "opjobhub_employer_ai_matches",
    description: "Get AI-generated candidate matches for the employer's active job postings. Requires API token authentication.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

// ─── Request Handlers ──────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "opjobhub_search_jobs": {
        const params = z.object({
          q: z.string().optional(),
          location: z.string().optional(),
          industry: z.string().optional(),
          employmentType: z.enum(["Full-Time", "Part-Time", "Contract", "Freelance"]).optional(),
          experienceLevel: z.string().optional(),
          visaSponsored: z.boolean().optional(),
          remote: z.boolean().optional(),
          limit: z.number().min(1).max(50).optional(),
        }).parse(args);

        const jobs = await searchJobs(params);
        return {
          content: [{ type: "text", text: JSON.stringify(jobs, null, 2) }],
        };
      }

      case "opjobhub_get_job": {
        const { id } = z.object({ id: z.number() }).parse(args);
        const job = await getJob(id);
        return {
          content: [{ type: "text", text: JSON.stringify(job, null, 2) }],
        };
      }

      case "opjobhub_match_skills": {
        const params = z.object({
          skills: z.array(z.string()).min(1),
          experience: z.string().optional(),
          location: z.string().optional(),
        }).parse(args);

        const result = await matchByProfile(params);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "opjobhub_market_insights": {
        const params = z.object({
          skills: z.array(z.string()).optional(),
          targetRole: z.string().optional(),
        }).parse(args);

        const insights = await getMarketInsights(params);
        return {
          content: [{ type: "text", text: JSON.stringify(insights, null, 2) }],
        };
      }

      case "opjobhub_employer_stats": {
        if (!process.env.OPJOBHUB_API_TOKEN) {
          return {
            content: [{ type: "text", text: "Authentication required. Set OPJOBHUB_API_TOKEN environment variable." }],
            isError: true,
          };
        }
        const stats = await getEmployerStats();
        return {
          content: [{ type: "text", text: JSON.stringify(stats, null, 2) }],
        };
      }

      case "opjobhub_employer_ai_matches": {
        if (!process.env.OPJOBHUB_API_TOKEN) {
          return {
            content: [{ type: "text", text: "Authentication required. Set OPJOBHUB_API_TOKEN environment variable." }],
            isError: true,
          };
        }
        const matches = await getEmployerAIMatches();
        return {
          content: [{ type: "text", text: JSON.stringify(matches, null, 2) }],
        };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// ─── Start Server ──────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("OpJobHub MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
