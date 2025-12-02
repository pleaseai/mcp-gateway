# MCP Tool Search

MCP server and CLI for searching MCP tools using **regex**, **BM25**, or **semantic (embedding)** search.

## Monorepo Structure

```
mcp-search/
├── apps/
│   └── cli/                 # CLI application (@pleaseai/mcp-cli)
├── packages/
│   ├── core/                # Core search engine (@pleaseai/mcp-core)
│   └── server/              # MCP server (@pleaseai/mcp-server)
├── turbo.json               # Turbo build configuration
└── package.json             # Root workspace configuration
```

## Features

- **Multiple Search Modes**:
  - **Regex**: Pattern matching on tool names and descriptions
  - **BM25**: Traditional text search ranking algorithm
  - **Embedding**: Semantic search using vector similarity

- **Configurable Embedding Providers**:
  - **Local**: all-MiniLM-L6-v2 via transformers.js (no API key required)
  - **OpenAI**: OpenAI Embeddings API
  - **Voyage AI**: Voyage AI embeddings

- **Tool Source**: Load tool definitions from JSON/YAML files

- **MCP Server**: Expose `tool_search` capability via MCP protocol

## Installation

```bash
bun install
bun run build
```

## CLI Usage

### Index Tools

Build a search index from tool definitions:

```bash
# Index without embeddings (faster, BM25/regex only)
bun apps/cli/dist/index.js index apps/cli/examples/tools.json --no-embeddings

# Index with local embeddings (default)
bun apps/cli/dist/index.js index apps/cli/examples/tools.json

# Index with OpenAI embeddings
bun apps/cli/dist/index.js index apps/cli/examples/tools.json -p openai

# Force overwrite existing index
bun apps/cli/dist/index.js index apps/cli/examples/tools.json -f
```

### Search Tools

Search for tools in the index:

```bash
# BM25 search (default)
bun apps/cli/dist/index.js search "file operations"

# Regex search
bun apps/cli/dist/index.js search "read.*file" --mode regex

# Semantic search
bun apps/cli/dist/index.js search "tools for sending messages" --mode embedding

# Limit results
bun apps/cli/dist/index.js search "database" -k 5

# JSON output
bun apps/cli/dist/index.js search "database" --format json
```

### Start MCP Server

Start the MCP server for tool search:

```bash
# stdio transport (default)
bun apps/cli/dist/index.js serve

# Specify index path
bun apps/cli/dist/index.js serve -i ./data/index.json

# Set default search mode
bun apps/cli/dist/index.js serve -m embedding
```

## Development

```bash
# Install dependencies
bun install

# Build all packages
bun run build

# Build specific package
bun run build --filter=@pleaseai/mcp-core

# Development mode (watch)
bun run dev

# Type check
bun run typecheck

# Clean build artifacts
bun run clean
```

## Packages

### @pleaseai/mcp-core

Core search engine with:
- Search strategies (Regex, BM25, Embedding)
- Embedding providers (Local, OpenAI, Voyage AI)
- Index management (loader, builder, storage)

### @pleaseai/mcp-server

MCP server exposing:
- `tool_search` - Search with query, mode, top_k, threshold
- `tool_search_info` - Get index metadata
- `tool_search_list` - List all indexed tools

### @pleaseai/mcp-cli

CLI commands:
- `index` - Build search index from tool definitions
- `search` - Search for tools
- `serve` - Start MCP server

## MCP Server Tools

### `tool_search`

Search for tools using regex, BM25, or semantic search.

**Parameters:**
- `query` (string, required): Search query string
- `mode` (string, optional): Search mode - `regex`, `bm25`, or `embedding` (default: `bm25`)
- `top_k` (number, optional): Maximum results to return (default: 10)
- `threshold` (number, optional): Minimum score threshold 0-1 (default: 0)

### `tool_search_info`

Get information about the tool search index.

### `tool_search_list`

List all tools in the index.

**Parameters:**
- `limit` (number, optional): Maximum tools to return (default: 100)
- `offset` (number, optional): Pagination offset (default: 0)

## Configuration

### Environment Variables

```bash
# OpenAI API Key (for OpenAI embedding provider)
OPENAI_API_KEY=sk-...

# Voyage AI API Key (for Voyage embedding provider)
VOYAGE_API_KEY=pa-...
```

## Tool Definition Format

Tool definitions follow the MCP tool specification:

```json
{
  "tools": [
    {
      "name": "read_file",
      "title": "Read File",
      "description": "Read the contents of a file from the filesystem",
      "inputSchema": {
        "type": "object",
        "properties": {
          "path": {
            "type": "string",
            "description": "The path to the file to read"
          }
        },
        "required": ["path"]
      }
    }
  ]
}
```

## License

MIT
