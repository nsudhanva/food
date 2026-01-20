# OpenAI Client

Now let's create the OpenAI client that will generate our chat responses. We'll implement streaming for real-time responses.

## Step 1: Create the Client

Create `app/llm/openai_client.py`:

```python title="app/llm/openai_client.py"
from typing import AsyncGenerator
from openai import AsyncOpenAI

from app.core.config import settings

# System prompt that defines the AI's personality
SYSTEM_PROMPT = """You are an expert on Indian vegetarian cuisine with deep knowledge of regional dishes, cooking techniques, and nutrition. You help users discover authentic Indian vegetarian food based on their preferences.

Guidelines:
- Recommend only dishes from the provided context
- Consider user's spice preference, allergies, and health goals  
- Explain why each recommendation fits their needs
- Include preparation tips when relevant
- Be warm and enthusiastic about Indian food culture
- Keep responses concise but informative
- Use markdown formatting for better readability

If you don't have information about a dish in the context, say so rather than making things up."""


class OpenAIClient:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_model
    
    async def generate_response(
        self,
        user_message: str,
        context: str,
        preferences: dict = None,
        chat_history: list[dict] = None
    ) -> AsyncGenerator[str, None]:
        """Generate a streaming response."""
        
        # Build the messages
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        # Add chat history if provided
        if chat_history:
            messages.extend(chat_history)
        
        # Build the user message with context
        formatted_message = self._format_user_message(
            user_message, context, preferences
        )
        messages.append({"role": "user", "content": formatted_message})
        
        # Create streaming completion
        stream = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            stream=True,
            temperature=0.7,
            max_tokens=1000
        )
        
        # Yield tokens as they arrive
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    
    def _format_user_message(
        self,
        message: str,
        context: str,
        preferences: dict = None
    ) -> str:
        """Format the user message with context and preferences."""
        
        parts = []
        
        # Add preferences section
        if preferences:
            pref_text = self._format_preferences(preferences)
            parts.append(f"User Preferences:\n{pref_text}")
        
        # Add context section
        if context:
            parts.append(f"Available Dishes from Database:\n{context}")
        
        # Add the actual question
        parts.append(f"User's Question: {message}")
        
        return "\n\n---\n\n".join(parts)
    
    def _format_preferences(self, preferences: dict) -> str:
        """Format preferences for the prompt."""
        lines = []
        
        if preferences.get("spice_level"):
            lines.append(f"- Spice tolerance: {preferences['spice_level']}")
        
        if preferences.get("allergies"):
            allergies = preferences["allergies"]
            if isinstance(allergies, list) and allergies:
                lines.append(f"- Allergies/Avoid: {', '.join(allergies)}")
        
        if preferences.get("health_goals"):
            goals = preferences["health_goals"]
            if isinstance(goals, list) and goals:
                lines.append(f"- Health goals: {', '.join(goals)}")
        
        if preferences.get("preferred_cuisines"):
            cuisines = preferences["preferred_cuisines"]
            if isinstance(cuisines, list) and cuisines:
                lines.append(f"- Preferred cuisines: {', '.join(cuisines)}")
        
        return "\n".join(lines) if lines else "No specific preferences set"


# Singleton instance
openai_client = OpenAIClient()
```

## Understanding the Code

### Async OpenAI Client

We use `AsyncOpenAI` for non-blocking API calls:

```python
from openai import AsyncOpenAI  # Not OpenAI

client = AsyncOpenAI(api_key="...")
```

This is important because:

- FastAPI is async
- We don't want to block other requests while waiting for OpenAI
- Streaming requires async iteration

### Streaming

Instead of waiting for the complete response:

```python
# Non-streaming (waits for complete response)
response = await client.chat.completions.create(
    model="gpt-4o-mini",
    messages=messages,
    stream=False  # Default
)
print(response.choices[0].message.content)

# Streaming (yields tokens as they arrive)
stream = await client.chat.completions.create(
    model="gpt-4o-mini",
    messages=messages,
    stream=True
)
async for chunk in stream:
    print(chunk.choices[0].delta.content, end="")
```

### The Generator Pattern

Our method is an **async generator**:

```python
async def generate_response(...) -> AsyncGenerator[str, None]:
    ...
    async for chunk in stream:
        yield chunk.choices[0].delta.content
```

This allows the caller to iterate over tokens:

```python
async for token in openai_client.generate_response(...):
    send_to_client(token)
```

## Prompt Engineering

Our prompt has three parts:

### 1. System Prompt

Sets the AI's personality and rules:

```python
SYSTEM_PROMPT = """You are an expert on Indian vegetarian cuisine...

Guidelines:
- Recommend only dishes from the provided context
- Consider user's preferences...
"""
```

### 2. Context (Retrieved Dishes)

From our ChromaDB search:

```
Available Dishes from Database:

1. Pesarattu: A protein-rich crepe from Andhra Pradesh made with green moong dal...
   Cuisine: south_indian
   Spice level: medium
   
2. Upma: A savory semolina dish...
   Cuisine: south_indian
   Spice level: mild
```

### 3. User Message

The actual question with preferences:

```
User Preferences:
- Spice tolerance: medium
- Allergies/Avoid: dairy, nuts
- Health goals: high protein

User's Question: What should I have for breakfast?
```

## Model Parameters

```python
await client.chat.completions.create(
    model="gpt-4o-mini",  # Fast and cheap
    messages=messages,
    stream=True,
    temperature=0.7,      # 0=deterministic, 1=creative
    max_tokens=1000       # Response length limit
)
```

| Parameter | Our Value | Why |
|-----------|-----------|-----|
| `model` | gpt-4o-mini | Good balance of quality and cost |
| `temperature` | 0.7 | Slightly creative but consistent |
| `max_tokens` | 1000 | Enough for detailed recommendations |

## Export the Client

Create `app/llm/__init__.py`:

```python title="app/llm/__init__.py"
from .openai_client import openai_client, OpenAIClient

__all__ = ["openai_client", "OpenAIClient"]
```

## Error Handling

In production, add error handling:

```python
from openai import APIError, RateLimitError

async def generate_response(...):
    try:
        stream = await self.client.chat.completions.create(...)
        async for chunk in stream:
            yield chunk.choices[0].delta.content
    except RateLimitError:
        yield "I'm receiving too many requests. Please try again in a moment."
    except APIError as e:
        yield f"An error occurred: {str(e)}"
```

## Cost Estimation

GPT-4o-mini pricing (as of 2024):

- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens

A typical chat interaction:

- Input: ~500 tokens (system + context + question)
- Output: ~200 tokens (response)

Cost per interaction: ~$0.0002 (0.02 cents)

1000 user interactions ≈ $0.20

---

Next, let's build the RAG retriever that ties it all together.
