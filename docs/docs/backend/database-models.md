# Database Models

We'll use **SQLModel** - a library that combines SQLAlchemy (database ORM) with Pydantic (data validation). It's from the same author as FastAPI.

## Why SQLModel?

- **One class, two uses** - Same model for database AND API
- **Type hints** - Full IDE support
- **Async support** - Works with async database drivers
- **Familiar** - If you know SQLAlchemy or Pydantic, you know SQLModel

## Our Data Models

We need to store:

1. **Users** - Basic user info
2. **Preferences** - Dietary preferences
3. **Chat Sessions** - Conversation containers
4. **Chat Messages** - Individual messages

## Step 1: Database Connection

Create `app/db/database.py`:

```python title="app/db/database.py"
from sqlmodel import SQLModel, create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Sync engine (for creating tables)
sync_engine = create_engine(
    settings.database_url.replace("postgresql://", "postgresql+psycopg2://"),
    echo=settings.debug
)

# Async engine (for queries)
async_engine = create_async_engine(
    settings.database_url.replace("postgresql://", "postgresql+asyncpg://"),
    echo=settings.debug
)

# Session factory
async_session = sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def init_db():
    """Create all tables."""
    SQLModel.metadata.create_all(sync_engine)

async def get_session():
    """Dependency for getting database sessions."""
    async with async_session() as session:
        yield session
```

### Understanding the Connection Strings

PostgreSQL connection strings have different formats for different drivers:

```
Original:     postgresql://food:food@localhost:5432/food
Sync (psycopg2): postgresql+psycopg2://...  # For table creation
Async (asyncpg): postgresql+asyncpg://...   # For async queries
```

## Step 2: User Models

Create `app/db/models.py`:

```python title="app/db/models.py"
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship

class User(SQLModel, table=True):
    """User account."""
    id: Optional[int] = Field(default=None, primary_key=True)
    external_id: str = Field(unique=True, index=True)  # From frontend
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    preferences: Optional["UserPreferences"] = Relationship(back_populates="user")
    sessions: list["ChatSession"] = Relationship(back_populates="user")


class UserPreferences(SQLModel, table=True):
    """User dietary preferences."""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True)
    
    dietary_type: str = Field(default="vegetarian")
    spice_level: str = Field(default="medium")
    allergies: str = Field(default="[]")  # JSON array as string
    health_goals: str = Field(default="[]")
    preferred_cuisines: str = Field(default='["south_indian", "north_indian"]')
    
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationship
    user: Optional[User] = Relationship(back_populates="preferences")
```

### Field Options

```python
# Primary key (auto-increment)
id: Optional[int] = Field(default=None, primary_key=True)

# Unique constraint with index for fast lookups
external_id: str = Field(unique=True, index=True)

# Foreign key
user_id: int = Field(foreign_key="user.id")

# Default value
spice_level: str = Field(default="medium")

# Default factory (function called for each new row)
created_at: datetime = Field(default_factory=datetime.utcnow)
```

## Step 3: Chat Models

Add to `app/db/models.py`:

```python title="app/db/models.py (continued)"
class ChatSession(SQLModel, table=True):
    """A conversation container."""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    title: str = Field(default="New Chat")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    user: Optional[User] = Relationship(back_populates="sessions")
    messages: list["ChatMessage"] = Relationship(back_populates="session")


class ChatMessage(SQLModel, table=True):
    """A single message in a conversation."""
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="chatsession.id")
    
    role: str  # "user" or "assistant"
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationship
    session: Optional[ChatSession] = Relationship(back_populates="messages")
```

## Step 4: Food Model (For Reference)

Our food data lives in ChromaDB, not PostgreSQL. But here's what a food record looks like:

```python
# This is stored in ChromaDB, not PostgreSQL
FoodItem = {
    "id": "1",
    "name": "Masala Dosa",
    "description": "A crispy, savory crepe made from fermented rice and lentil batter...",
    "cuisine": "south_indian",
    "region": "Karnataka",
    "meal_type": ["breakfast", "dinner"],
    "spice_level": "medium",
    "prep_time_minutes": 30,
    "ingredients": ["rice", "urad dal", "potato", "onion", "spices"],
    "allergens": [],
    "is_vegetarian": True,
    "is_vegan": False,
    "nutrition": {
        "calories": 250,
        "protein": 6,
        "carbs": 40,
        "fat": 8
    }
}
```

## Step 5: Export Models

Create `app/db/__init__.py`:

```python title="app/db/__init__.py"
from .database import init_db, get_session, async_session
from .models import User, UserPreferences, ChatSession, ChatMessage

__all__ = [
    "init_db",
    "get_session", 
    "async_session",
    "User",
    "UserPreferences",
    "ChatSession",
    "ChatMessage",
]
```

## Using Models in Endpoints

Here's how you'd use these models in an API endpoint:

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.db import get_session, User, UserPreferences

router = APIRouter()

@router.get("/preferences/{user_id}")
async def get_preferences(
    user_id: str,
    session: AsyncSession = Depends(get_session)
):
    # Find user by external ID
    statement = select(User).where(User.external_id == user_id)
    result = await session.execute(statement)
    user = result.scalar_one_or_none()
    
    if not user:
        # Create new user with default preferences
        user = User(external_id=user_id)
        session.add(user)
        await session.commit()
        await session.refresh(user)
        
        preferences = UserPreferences(user_id=user.id)
        session.add(preferences)
        await session.commit()
        return preferences
    
    return user.preferences
```

### The `Depends` Pattern

FastAPI's dependency injection:

```python
async def get_current_user(
    session: AsyncSession = Depends(get_session)
):
    # This function can itself be a dependency
    ...

@router.get("/me")
async def get_me(
    user: User = Depends(get_current_user)  # Injected!
):
    return user
```

## Database Operations Cheat Sheet

```python
# Create
user = User(external_id="abc123")
session.add(user)
await session.commit()

# Read
statement = select(User).where(User.external_id == "abc123")
result = await session.execute(statement)
user = result.scalar_one_or_none()

# Update
user.preferences.spice_level = "hot"
await session.commit()

# Delete
await session.delete(user)
await session.commit()

# Refresh (get latest from DB)
await session.refresh(user)
```

---

Next, let's integrate ChromaDB for our food search functionality.
