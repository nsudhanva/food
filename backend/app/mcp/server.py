from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
import json

from app.rag import search_foods, get_food_by_id
from app.db.database import get_sync_session
from app.db.models import UserPreferences


server = Server("food-tools")


@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="search_food",
            description="Search for Indian vegetarian food based on query and preferences",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "What kind of food to search for"},
                    "allergies": {"type": "array", "items": {"type": "string"}, "description": "Allergens to exclude"},
                    "spice_level": {"type": "string", "enum": ["mild", "medium", "spicy", "extra_spicy"]},
                    "cuisine": {"type": "string", "description": "Preferred cuisine type"},
                    "meal_type": {"type": "string", "enum": ["breakfast", "lunch", "dinner", "snack", "dessert"]},
                },
                "required": ["query"],
            },
        ),
        Tool(
            name="get_food_details",
            description="Get detailed information about a specific food item",
            inputSchema={
                "type": "object",
                "properties": {
                    "food_id": {"type": "string", "description": "The food item ID"},
                },
                "required": ["food_id"],
            },
        ),
        Tool(
            name="save_preferences",
            description="Save user dietary preferences",
            inputSchema={
                "type": "object",
                "properties": {
                    "user_id": {"type": "string"},
                    "dietary_type": {"type": "string"},
                    "spice_level": {"type": "string"},
                    "allergies": {"type": "array", "items": {"type": "string"}},
                    "preferred_cuisines": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["user_id"],
            },
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "search_food":
        results = search_foods(
            query=arguments["query"],
            allergies=arguments.get("allergies"),
            spice_level=arguments.get("spice_level"),
            meal_type=arguments.get("meal_type"),
        )
        return [TextContent(type="text", text=json.dumps(results, indent=2))]
    
    elif name == "get_food_details":
        food = get_food_by_id(arguments["food_id"])
        if food:
            return [TextContent(type="text", text=json.dumps(food, indent=2))]
        return [TextContent(type="text", text="Food not found")]
    
    elif name == "save_preferences":
        with get_sync_session() as session:
            prefs = session.query(UserPreferences).filter_by(user_id=arguments["user_id"]).first()
            if not prefs:
                prefs = UserPreferences(user_id=arguments["user_id"])
                session.add(prefs)
            
            for key in ["dietary_type", "spice_level", "allergies", "preferred_cuisines"]:
                if key in arguments:
                    setattr(prefs, key, arguments[key])
            
            session.commit()
        return [TextContent(type="text", text="Preferences saved")]
    
    return [TextContent(type="text", text=f"Unknown tool: {name}")]


async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream)


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
