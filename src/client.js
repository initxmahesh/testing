#!/usr/bin/env node

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 Starting MCP Client...");

  // 🔌 Connect to the MCP server (spawn it)
  const serverPath = path.join(__dirname, "./server.js"); // update if needed
  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
  });

  const client = new Client(
    {
      name: "test-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  try {
    await client.connect(transport);
    console.log("✅ Connected to MCP Server");

    // 🧰 List all available tools
    const toolsResponse = await client.listTools();
    console.log(
      "🧰 Available Tools:",
      toolsResponse.tools.map((t) => t.name)
    );

    // 🧠 Example 1: Test websearch tool
    console.log("\n🔎 Running 'websearch'...");
    const websearchResult = await client.callTool("websearch", {
      query: "email marketing trends 2025",
      maxResults: 3,
    });
    console.log("✨ Websearch Summary:\n", websearchResult.content[0].text);

    // 🧠 Example 2: Test best practices tool
    console.log("\n🔎 Running 'search_email_best_practices'...");
    const bestResult = await client.callTool("search_email_best_practices", {
      topic: "subject lines",
      maxResults: 3,
    });
    console.log("✨ Best Practice Summary:\n", bestResult.content[0].text);
  } catch (err) {
    console.error("❌ MCP Client Error:", err);
  }
}

main();
