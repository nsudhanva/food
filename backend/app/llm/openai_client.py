from typing import AsyncGenerator
from openai import AsyncOpenAI
from app.core.config import settings


def get_openai_client() -> AsyncOpenAI:
    return AsyncOpenAI(api_key=settings.openai_api_key)


SYSTEM_PROMPT = """You are a friendly and knowledgeable Indian food recommendation assistant. You specialize in vegetarian Indian cuisine from all regions - South Indian, North Indian, Gujarati, Bengali, Rajasthani, and more.

Your personality:
- Warm and enthusiastic about Indian food
- Share interesting cultural context and stories about dishes
- Give practical cooking tips when relevant
- Respect dietary restrictions strictly

When making recommendations:
1. Consider the user's preferences, allergies, and health goals
2. Suggest dishes that match the meal type and occasion
3. Explain why each dish would be good for them
4. Include nutrition highlights when relevant
5. Suggest complementary dishes (like pairing with raita or chutney)

Always format your recommendations clearly. For each dish, include:
- The name and region of origin
- A brief, appetizing description
- Why it suits their preferences
- Any tips for preparation or serving

If the user has allergies or restrictions, explicitly confirm that your suggestions avoid those items."""


async def generate_streaming_response(
    messages: list[dict],
    context: str | None = None,
) -> AsyncGenerator[str, None]:
    client = get_openai_client()
    
    full_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    
    if context:
        full_messages.append({
            "role": "system",
            "content": f"Here are some relevant dishes from our database:\n\n{context}\n\nUse this to make personalized recommendations."
        })
    
    full_messages.extend(messages)
    
    stream = await client.chat.completions.create(
        model=settings.openai_model,
        messages=full_messages,
        stream=True,
        temperature=0.7,
        max_tokens=1500,
    )
    
    async for chunk in stream:
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content


async def generate_response(
    messages: list[dict],
    context: str | None = None,
) -> str:
    client = get_openai_client()
    
    full_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    
    if context:
        full_messages.append({
            "role": "system",
            "content": f"Relevant dishes:\n\n{context}"
        })
    
    full_messages.extend(messages)
    
    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=full_messages,
        temperature=0.7,
        max_tokens=1500,
    )
    
    return response.choices[0].message.content or ""
