import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SoftclipApiClient } from "./client.js";
import { readConfigFromEnv, type SoftclipMcpConfig } from "./config.js";
import { createToolDefinitions } from "./tools.js";

export function createSoftclipMcpServer(config: SoftclipMcpConfig = readConfigFromEnv()) {
  const server = new McpServer({
    name: "softclip",
    version: "0.1.0",
  });

  const client = new SoftclipApiClient(config);
  const tools = createToolDefinitions(client);
  for (const tool of tools) {
    server.tool(tool.name, tool.description, tool.schema.shape, tool.execute);
  }

  return {
    server,
    tools,
    client,
  };
}

export async function runServer(config: SoftclipMcpConfig = readConfigFromEnv()) {
  const { server } = createSoftclipMcpServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
