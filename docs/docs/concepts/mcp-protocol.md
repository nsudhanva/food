# MCP Protocol

MCP (Model Context Protocol) is an open standard for connecting AI models to external tools and data sources. Think of it as a universal adapter for AI.

## Why MCP Exists

Different AI tools (ChatGPT, Claude, Copilot) each have their own way of calling external functions. MCP standardizes this:

```
Before MCP:
┌──────────┐     proprietary API     ┌─────────────┐
│ ChatGPT  │ ◄─────────────────────► │ Your Tool   │
└──────────┘                         └─────────────┘
┌──────────┐     different API       ┌─────────────┐
│  Claude  │ ◄─────────────────────► │ Your Tool   │
└──────────┘                         └─────────────┘
                     ↑
            Each needs custom code

After MCP:
┌──────────┐                         ┌─────────────┐
│ ChatGPT  │ ◄───┐                   │             │
└──────────┘     │                   │  MCP Server │
┌──────────┐     │     MCP Protocol  │  (Your App) │
│  Claude  │ ◄───┼───────────────────│             │
└──────────┘     │                   └─────────────┘
┌──────────┐     │
│  VS Code │ ◄───┘
└──────────┘
            One standard, works everywhere
```

## MCP Concepts

### Server

An MCP server exposes tools and resources. In our app, the FastAPI backend includes an MCP server.

### Tools

Functions that AI can call. Each tool has:

- **Name** - e.g., `search_food`
- **Description** - What the tool does
- **Parameters** - Input schema
- **Handler** - The actual function

### Resources

Data that AI can read (like files or database records). We focus on tools in this guide.

## Our MCP Tools

We expose three tools:

### 1. `search_food`

Search for dishes by natural language query with filters.

```python
@server.tool()
async def search_food(
    query: str,
    cuisine: str = None,
    spice_level: str = None,
    exclude_allergens: list[str] = None
) -> list[dict]:
    """
    Search for Indian dishes matching the query.
    
    Args:
        query: Natural language search query
        cuisine: Filter by cuisine (south_indian, north_indian, etc.)
        spice_level: Filter by spice level (mild, medium, hot)
        exclude_allergens: List of allergens to exclude
    
    Returns:
        List of matching dishes with details
    """
    results = retriever.search(
        query=query,
        cuisine=cuisine,
        spice_level=spice_level,
        exclude_allergens=exclude_allergens
    )
    return results
```

### 2. `get_food_details`

Get complete information about a specific dish.

```python
@server.tool()
async def get_food_details(food_name: str) -> dict:
    """
    Get detailed information about a specific dish.
    
    Args:
        food_name: Name of the dish
    
    Returns:
        Complete dish information including nutrition, recipe, etc.
    """
    return retriever.get_by_name(food_name)
```

### 3. `save_preferences`

Save user dietary preferences.

```python
@server.tool()
async def save_preferences(
    user_id: str,
    preferences: dict
) -> dict:
    """
    Save user's dietary preferences.
    
    Args:
        user_id: Unique user identifier
        preferences: Dict with spice_level, allergies, cuisines, etc.
    
    Returns:
        Confirmation with saved preferences
    """
    return await preferences_service.save(user_id, preferences)
```

## How AI Uses MCP Tools

When Claude Desktop or another MCP-compatible AI is connected to our server:

```
User: "Find me a mild South Indian breakfast without dairy"

AI (internal): I should use the search_food tool
    ↓
MCP Call: search_food(
    query="breakfast",
    cuisine="south_indian", 
    spice_level="mild",
    exclude_allergens=["dairy"]
)
    ↓
MCP Server: Executes search, returns results
    ↓
AI: "I found several options! Idli is a great choice..."
```

## Setting Up MCP

### Installation

```bash
pip install mcp
```

### Basic Server

```python
from mcp import Server

# Create server
server = Server("food-companion")

# Define a tool
@server.tool()
async def hello(name: str) -> str:
    """Say hello to someone."""
    return f"Hello, {name}!"

# Run the server
if __name__ == "__main__":
    server.run()
```

### Connecting to Claude Desktop

Add to Claude Desktop's config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "food-companion": {
      "command": "uv",
      "args": ["run", "python", "-m", "app.mcp.server"],
      "cwd": "/path/to/food-companion/backend"
    }
  }
}
```

Now Claude Desktop can use your food search tools!

## MCP vs REST API

| Aspect | REST API | MCP |
|--------|----------|-----|
| **Consumer** | Your frontend | AI models |
| **Protocol** | HTTP | stdio/SSE |
| **Discovery** | API docs | Tool descriptions |
| **Use case** | Human-facing apps | AI integrations |

We have **both**:

- **REST API** - For our React frontend
- **MCP Server** - For AI assistants like Claude

## Benefits of MCP

1. **Standardization** - Write once, work with any MCP client
2. **Discoverability** - AI can see what tools are available
3. **Type safety** - Schema validation built-in
4. **Ecosystem** - Growing list of MCP-compatible tools

## Key Takeaways

1. **MCP is a standard protocol** for AI-to-tool communication
2. **Tools are functions** that AI can call with parameters
3. **Our app exposes food search tools** via MCP
4. **Works with Claude Desktop**, VS Code, and other clients

---

Now that we understand the concepts, let's build the backend!
