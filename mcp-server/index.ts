import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const server = new Server(
  {
    name: "myeyes-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_product_catalog",
        description: "Fetch eyewear products from the myeyes.pk database with optional filtering by material.",
        inputSchema: {
          type: "object",
          properties: {
            material: {
              type: "string",
              description: "Filter by material type (e.g., acetate, titanium, metal)",
            },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "get_product_catalog") {
    try {
      const material = (request.params.arguments as { material?: string })?.material;
      let query = `SELECT id, name, price, material, "frameShape" AS shape, category, gender, stock FROM "Product"`;
      let values: string[] = [];

      if (material) {
        query += ` WHERE material::text ILIKE $1`;
        values.push(`%${material}%`);
      }

      const result = await pool.query(query, values);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result.rows, null, 2),
          },
        ],
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Database query failed: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MyEyes MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
