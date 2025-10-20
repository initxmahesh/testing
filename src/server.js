import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { tavily } from "@tavily/core";
import config from "../config/config.js";
import { z } from "zod";

const server = new McpServer({
  name: "mailchimp-agent",
  version: "1.0.0",
  capabilities: {
    tools: {},
  },
});

const apiKey =
  config.TAVILY_API_KEY || "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";
console.log(apiKey);
if (!apiKey) throw new Error("TAVILY_API_KEY missing in config!");

const tavlyClient = tavily({ apiKey });

async function performSearch(query, maxResults = 5) {
  console.error("🔍 Searching Tavily for:", query);

  const result = await tavlyClient.search(query, { maxResults });

  if (!result?.results?.length)
    return { summary: "No relevant results found.", results: [] };

  // Combine snippets into a compact summary
  const combinedText = result.results
    .map((r) => r.content)
    .filter(Boolean)
    .join(" ");

  const summary =
    combinedText.length > 0
      ? combinedText.slice(0, 2000) + "..."
      : "No content snippets available.";

  console.log(`✅ Found ${result.results.length} results`);
  return { summary, results: result.results };
}

server.tool(
  "Search trends",
  "Latest email marketing trends 2025",
  {
    query: z.string(),
    maxResults: z.number().default(5),
  },
  async ({ query, maxResults }) => {
    const data = await tavlyClient.search(query, {
      maxResults,
      searchDepth: "advanced",
      "include_raw_content": true,
      includeRawContent: true,
      includeAnswer: true,
    });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data),
        },
      ],
    };
  }
);

// server.tool(
//   "websearch",
//   "Find latest email marketing trends",
//   {
//     title: "Email Marketing Trends Search",
//     description: "Search for email marketing trends",
//     inputSchema: {
//       type: "object",
//       properties: {
//         query: { type: "string", description: "Search query" },
//         maxResults: {
//           type: "number",
//           description: "Number of results",
//           default: 5,
//         },
//       },
//     },
//   },
//   async (input) => {
//     return await performSearch(input.query, input.maxResults);
//   }
// );

server.tool(
  "search_email_best_practices",
  "Find latest email marketing best practices",
  {
    title: "Email Best Practices Search",
    description: "Searches for current best practices in email marketing.",
    inputSchema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "Specific topic (e.g., 'subject lines', 'design')",
          default: "general",
        },
        maxResults: {
          type: "number",
          description: "Number of results to fetch (default: 5)",
          default: 5,
        },
      },
    },
  },
  async (input = {}) => {
    const query = `email marketing best practices ${input.topic || "general"}`;
    return await performSearch(query, input.maxResults);
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
