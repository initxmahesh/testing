import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { tavily } from "@tavily/core";
import config from "../config/config.js";
import { z } from "zod";

// 🧩 Initialize MCP Server
const server = new McpServer({
  name: "mailchimp-agent",
  version: "1.0.0",
  capabilities: { tools: {} },
});

// 🔑 API Key
const apiKey = config.TAVILY_API_KEY;
if (!apiKey) throw new Error("TAVILY_API_KEY missing in config!");
const tavlyClient = tavily({ apiKey });

// Cleaning the raw content
function cleanText(text) {
  if (!text) return "";
  return text
    .replace(
      /(\s*Navigation\s*|Back\s*to\s*top\s*|Related\s*Articles|Footer)/gi,
      ""
    )
    .replace(/https?:\/\/[^\s]+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extractMainContent(rawContent) {
  const lines = rawContent
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // keep first relevant section, skip nav/footer
  const filtered = lines.filter(
    (line) =>
      !/^(\s*(Home|Menu|Navigation|Contact|Privacy|Cookies))/i.test(line) &&
      line.length > 50
  );

  return filtered.slice(0, 45).join(" ");
}

// Helper: Perform smart Tavily search
async function performRichSearch(query, maxResults = 5) {
  console.error(`Tavily Search -> ${query}`);

  const result = await tavlyClient.search(query, {
    maxResults,
    searchDepth: "advanced",
    includeAnswer: true,
    include_raw_content: true,
  });

  if (!result?.results?.length) {
    return { summary: "No relevant results found.", results: [] };
  }

  // Extract and clean text
  const processed = result.results.map((r) => ({
    title: r.title,
    url: r.url,
    snippet: extractMainContent(cleanText(r.content)),
  }));

  // Combine into readable summary
  const combinedText = processed.map((p) => p.snippet).join(" ");
  const summary = combinedText.slice(0, 3500) + "...";

  return { summary, results: processed };
}

// Tool 1: Search Email Trends
server.tool(
  "search_email_trends",
  "Search for latest email marketing trends",
  {
    query: z.string(),
    maxResults: z.number().default(5),
  },
  async ({ query, maxResults }) => {
    const data = await performRichSearch(query, maxResults);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

// Tool 2: Search Best Practices
server.tool(
  "search_email_best_practices",
  "Find latest email marketing best practices",
  {
    query: z.string(),
    maxResults: z.number().default(5),
  },
  async ({ query, maxResults }) => {
    const data = await performRichSearch(query, maxResults);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

// Start MCP server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ MCP Server running...");
}

main();
