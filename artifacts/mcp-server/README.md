# OpJobHub MCP Server

Expose recruitment operations to AI assistants (Claude Desktop, Cursor, VS Code AI, etc.) via the Model Context Protocol.

## Tools

| Tool | Description | Auth Required |
|------|-------------|---------------|
| `opjobhub_search_jobs` | Search Gulf/Middle East jobs by keyword, location, industry, type, experience, visa, remote | No |
| `opjobhub_get_job` | Get full job details by ID | No |
| `opjobhub_match_skills` | Match candidate skills/experience/location against active jobs | No |
| `opjobhub_market_insights` | Labor market intelligence: trending skills, salary data, demand levels | No |
| `opjobhub_employer_stats` | Dashboard stats: jobs, applicants, hires, pipeline | Yes (API token) |
| `opjobhub_employer_ai_matches` | AI candidate matches for employer's jobs | Yes (API token) |

## Setup

### 1. Build

```bash
cd artifacts/mcp-server
pnpm install
pnpm build
```

### 2. Configure Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "opjobhub": {
      "command": "node",
      "args": ["path/to/opjobhub/artifacts/mcp-server/dist/index.js"],
      "env": {
        "OPJOBHUB_API_URL": "https://op-job-hub.vercel.app/api",
        "OPJOBHUB_API_TOKEN": "your-jwt-token-here"
      }
    }
  }
}
```

### 3. Configure Cursor

In Cursor Settings > Features > MCP Servers, add:

```
Name: opjobhub
Type: command
Command: node path/to/artifacts/mcp-server/dist/index.js
Environment variables:
  OPJOBHUB_API_URL=https://op-job-hub.vercel.app/api
  OPJOBHUB_API_TOKEN=your-jwt-token-here
```

### 4. Get an API Token

Log in to OpJobHub as an employer, then use your JWT token from the dashboard. The token goes in `OPJOBHUB_API_TOKEN`.

## Example Queries

Once connected, you can ask Claude:

- *"Find React developer jobs in Doha with visa sponsorship"*
- *"What are the top trending skills in the Gulf tech market?"*
- *"Match my skills (React, Node.js, TypeScript, AWS) against available jobs"*
- *"Show me my hiring statistics and pipeline"* (requires token)
- *"What jobs are available for senior engineers in Saudi Arabia?"*
