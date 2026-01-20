# MCP Server

The MCP server exposes our food search functionality as tools that AI assistants like Claude can use.

## Why Build an MCP Server?

With MCP, you can:

- Use your food search in **Claude Desktop**
- Integrate with **VS Code AI extensions**
- Build **multi-agent workflows**
- Create **standardized tool interfaces**

## Step 1: Create the Server

Create `app/mcp/server.py`:

```python title="app/mcp/server.py"
import json
from mcp.server import Server
from mcp.types import Tool, TextContent

from app.rag import retriever

# Create the MCP server
server = Server("food-companion")


@server.list_tools()
async def list_tools() -> list[Tool]:
    """List available tools."""
    return [
        Tool(
            name="search_food",
            description="Search for Indian vegetarian dishes by query. Supports filtering by cuisine, spice level, and allergens.",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Natural language search query (e.g., 'spicy breakfast', 'high protein dinner')"
                    },
                    "cuisine": {
                        "type": "string",
                        "description": "Filter by cuisine type",
                        "enum": ["south_indian", "north_indian", "gujarati", "bengali", "maharashtrian", "rajasthani"]
                    },
                    "spice_level": {
                        "type": "string",
                        "description": "Filter by spice level",
                        "enum": ["mild", "medium", "hot"]
                    },
                    "exclude_allergens": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Allergens to exclude (e.g., ['dairy', 'nuts', 'gluten'])"
                    }
                },
                "required": ["query"]
            }
        ),
        Tool(
            name="get_food_details",
            description="Get detailed information about a specific dish by name.",
            inputSchema={
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Exact name of the dish (e.g., 'Masala Dosa', 'Idli')"
                    }
                },
                "required": ["name"]
            }
        ),
        Tool(
            name="list_cuisines",
            description="List all available cuisine types.",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    """Handle tool calls."""
    
    if name == "search_food":
        results = retriever.search(
            query=arguments["query"],
            cuisine=arguments.get("cuisine"),
            spice_level=arguments.get("spice_level"),
            exclude_allergens=arguments.get("exclude_allergens"),
            top_k=5
        )
        
        if not results:
            return [TextContent(
                type="text",
                text="No dishes found matching your criteria."
            )]
        
        formatted = []
        for dish in results:
            formatted.append(f"**{dish['name']}** ({dish['cuisine']})")
            formatted.append(f"Spice: {dish['spice_level']}")
            formatted.append(f"{dish['description']}")
            formatted.append("")
        
        return [TextContent(type="text", text="\n".join(formatted))]
    
    elif name == "get_food_details":
        dish = retriever.get_by_name(arguments["name"])
        
        if not dish:
            return [TextContent(
                type="text",
                text=f"Dish '{arguments['name']}' not found."
            )]
        
        return [TextContent(
            type="text",
            text=json.dumps(dish, indent=2)
        )]
    
    elif name == "list_cuisines":
        cuisines = [
            "south_indian - Dishes from Tamil Nadu, Karnataka, Kerala, Andhra Pradesh",
            "north_indian - Dishes from Punjab, Uttar Pradesh, Delhi",
            "gujarati - Dishes from Gujarat, known for sweet-savory balance",
            "bengali - Dishes from West Bengal, known for fish and sweets",
            "maharashtrian - Dishes from Maharashtra, varied from coastal to inland",
            "rajasthani - Dishes from Rajasthan, known for dry preparations"
        ]
        return [TextContent(type="text", text="\n".join(cuisines))]
    
    else:
        return [TextContent(type="text", text=f"Unknown tool: {name}")]


async def main():
    """Run the MCP server."""
    from mcp.server.stdio import stdio_server
    
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

## Understanding the Code

### Tool Definition

Each tool has:

- **name** - Identifier for the tool
- **description** - What the tool does (AI reads this!)
- **inputSchema** - JSON Schema for parameters

```python
Tool(
    name="search_food",
    description="Search for Indian dishes...",  # Be descriptive!
    inputSchema={
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Natural language query"
            }
        },
        "required": ["query"]
    }
)
```

### Tool Handler

The `call_tool` function routes requests to the right logic:

```python
@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "search_food":
        # Handle search
    elif name == "get_food_details":
        # Handle details
    ...
```

### Response Format

Tools return `TextContent` objects:

```python
return [TextContent(type="text", text="Results here...")]
```

## Step 2: Export the Server

Create `app/mcp/__init__.py`:

```python title="app/mcp/__init__.py"
from .server import server

__all__ = ["server"]
```

## Step 3: Configure Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json title="claude_desktop_config.json"
{
  "mcpServers": {
    "food-companion": {
      "command": "uv",
      "args": ["run", "python", "-m", "app.mcp.server"],
      "cwd": "/absolute/path/to/food-companion/backend",
      "env": {
        "CHROMA_HOST": "localhost",
        "CHROMA_PORT": "8000"
      }
    }
  }
}
```

:::caution Path Must Be Absolute
Replace `/absolute/path/to/food-companion/backend` with the actual full path to your backend directory.
:::

## Step 4: Test the Server

Restart Claude Desktop, then try:

> "What South Indian dishes are good for breakfast?"

Claude will:

1. See the `search_food` tool is available
2. Call it with appropriate parameters
3. Use the results to answer your question

## MCP Server Architecture

```
┌────────────────────┐     stdio      ┌────────────────────┐
│   Claude Desktop   │◄──────────────►│    MCP Server      │
│   (or other AI)    │                │  (food-companion)  │
└────────────────────┘                └─────────┬──────────┘
                                                │
                                      ┌─────────▼──────────┐
                                      │     ChromaDB       │
                                      │   (Food Search)    │
                                      └────────────────────┘
```

## Tool Best Practices

### Good Descriptions

```python
# Good - tells AI when and how to use it
description="Search for dishes by natural language query. Use when user asks for food recommendations. Supports filtering by cuisine, spice level, and dietary restrictions."

# Bad - too vague
description="Search foods"
```

### Clear Parameter Descriptions

```python
"exclude_allergens": {
    "type": "array",
    "items": {"type": "string"},
    "description": "List of allergens to exclude. Common values: 'dairy', 'nuts', 'gluten', 'soy'"
    # Include examples!
}
```

### Helpful Error Messages

```python
if not dish:
    return [TextContent(
        type="text",
        text=f"Dish '{name}' not found. Try searching first with search_food."
    )]
```

## Testing Without Claude

You can test the MCP server directly:

```bash
cd backend
echo '{"method": "tools/list"}' | uv run python -m app.mcp.server
```

---

That's the complete backend! Next, let's build the frontend.
