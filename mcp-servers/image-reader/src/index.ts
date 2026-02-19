#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import sharp from 'sharp';
import { statSync } from 'fs';
import { resolve } from 'path';

// Define the tool
const readImageMetadataTool: Tool = {
  name: 'read_image_metadata',
  description: 'Read image file metadata (dimensions, format, size, color space, etc.)',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to the image file (relative or absolute)',
      },
    },
    required: ['path'],
    additionalProperties: false,
  },
};

// Create server
const server = new Server(
  {
    name: 'image-reader',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [readImageMetadataTool],
}));

// Handle tool call
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== 'read_image_metadata') {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const { path } = request.params.arguments as { path: string };
  if (!path || typeof path !== 'string') {
    throw new Error('Path argument is required and must be a string');
  }

  try {
    // Resolve absolute path
    const absolutePath = resolve(process.cwd(), path);

    // Get file stats for size
    const stats = statSync(absolutePath);
    const fileSize = stats.size;

    // Use sharp to extract metadata
    const image = sharp(absolutePath);
    const metadata = await image.metadata();

    // Build response
    const result = {
      path: absolutePath,
      size: fileSize,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      space: metadata.space,
      channels: metadata.channels,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      hasProfile: metadata.hasProfile,
      orientation: metadata.orientation,
      exif: metadata.exif ? 'present' : undefined,
      iptc: metadata.iptc ? 'present' : undefined,
      xmp: metadata.xmp ? 'present' : undefined,
      tifftagPhotoshop: metadata.tifftagPhotoshop ? 'present' : undefined,
      // Additional sharp-specific fields
      isProgressive: metadata.isProgressive,
      compression: metadata.compression,
      resolutionUnit: metadata.resolutionUnit,
      // File info
      mimeType: metadata.format ? `image/${metadata.format}` : undefined,
    };

    // Remove undefined fields
    Object.keys(result).forEach(key => {
      if ((result as any)[key] === undefined) {
        delete (result as any)[key];
      }
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error reading image metadata: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Image Reader MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});