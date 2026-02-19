# Image Reader MCP Server

An MCP (Model Context Protocol) server for reading image metadata using the sharp library.

## Features

- Reads image metadata: width, height, format, size, color space, etc.
- Supports common image formats: PNG, JPEG, GIF, WebP, TIFF, AVIF, HEIC, etc.
- Returns comprehensive metadata including EXIF, orientation, channels, and more.
- Single tool: `read_image_metadata`

## Installation

```bash
cd mcp-servers/image-reader
npm install
npm run build
```

## Usage

### As an MCP Server

The server implements the MCP Stdio protocol and can be used with any MCP client (e.g., Claude Desktop, Roo Code).

Configuration example for `.roo/mcp.json`:
```json
{
  "mcpServers": {
    "image-reader": {
      "command": "node",
      "args": ["mcp-servers/image-reader/dist/index.js"]
    }
  }
}
```

### Tool Specification

**Tool Name**: `read_image_metadata`

**Parameters**:
- `path` (string, required): Path to the image file (relative or absolute)

**Returns**:
- JSON object containing:
  - `path`: absolute path
  - `size`: file size in bytes
  - `width`: image width in pixels
  - `height`: image height in pixels
  - `format`: image format (e.g., 'jpeg', 'png', 'webp')
  - `space`: color space (e.g., 'srgb', 'rgb', 'cmyk')
  - `channels`: number of channels (3 for RGB, 4 for RGBA)
  - `density`: pixel density (PPI)
  - `hasAlpha`: boolean indicating alpha channel
  - `hasProfile`: boolean indicating embedded ICC profile
  - `orientation`: EXIF orientation (1-8)
  - `isProgressive`: boolean for progressive JPEG
  - `compression`: compression type
  - `resolutionUnit`: resolution unit (e.g., 'inch')
  - `mimeType`: derived MIME type (e.g., 'image/jpeg')
  - `exif`, `iptc`, `xmp`, `tifftagPhotoshop`: presence indicators

## Development

### Project Structure
```
src/
  index.ts          # Main server implementation
dist/
  index.js         # Compiled JavaScript
package.json       # Dependencies and scripts
tsconfig.json      # TypeScript configuration
```

### Scripts
- `npm run build` - Compile TypeScript
- `npm start` - Run compiled server
- `npm run dev` - Run with tsx (development)
- `npm run watch` - Watch mode compilation

### Dependencies
- `@modelcontextprotocol/sdk`: MCP SDK for server implementation
- `sharp`: High-performance image processing
- TypeScript and tsx for development

## Example Output

```json
{
  "path": "/absolute/path/to/image.jpg",
  "size": 123456,
  "width": 1920,
  "height": 1080,
  "format": "jpeg",
  "space": "srgb",
  "channels": 3,
  "density": 72,
  "hasAlpha": false,
  "hasProfile": false,
  "orientation": 1,
  "isProgressive": false,
  "compression": "jpeg",
  "mimeType": "image/jpeg"
}
```

## Supported Formats

- JPEG, PNG, WebP, GIF, SVG, TIFF, HEIC, AVIF, RAW, and more (anything supported by libvips)

## Error Handling

If the image cannot be read (file not found, unsupported format, corrupted), the tool returns an error with a descriptive message.

## License

ISC