# Complete File Walkthrough

This section provides a detailed explanation of every file in the application. Understanding each piece helps you build similar applications from scratch.

## Backend Architecture

```mermaid
graph TB
    subgraph Backend["Backend Structure"]
        direction TB
        
        subgraph Entry["Entry Point"]
            main["main.py"]
        end
        
        subgraph API["API Layer"]
            chat["api/chat.py"]
            prefs["api/preferences.py"]
            convos["api/conversations.py"]
            admin["api/admin.py"]
        end
        
        subgraph Core["Core Services"]
            config["core/config.py"]
        end
        
        subgraph DB["Database Layer"]
            models["db/models.py"]
            database["db/database.py"]
        end
        
        subgraph RAG["RAG Pipeline"]
            retriever["rag/retriever.py"]
        end
        
        subgraph LLM["LLM Integration"]
            openai["llm/openai_client.py"]
        end
        
        subgraph MCP["MCP Tools"]
            server["mcp/server.py"]
        end
    end
    
    main --> API
    API --> Core
    API --> RAG
    API --> LLM
    API --> DB
    RAG --> DB
    MCP --> RAG
    MCP --> DB
```

## Frontend Architecture

```mermaid
graph TB
    subgraph Frontend["Frontend Structure"]
        direction TB
        
        subgraph Entry["Entry"]
            mainTsx["main.tsx"]
            app["App.tsx"]
        end
        
        subgraph Components["Components"]
            header["Header.tsx"]
            chatMsg["ChatMessage.tsx"]
            composer["ChatComposer.tsx"]
            prefsDialog["PreferencesDialog.tsx"]
            prefsSummary["PreferencesSummary.tsx"]
        end
        
        subgraph UI["UI Primitives"]
            button["ui/button.tsx"]
            dialog["ui/dialog.tsx"]
            tabs["ui/tabs.tsx"]
            textarea["ui/textarea.tsx"]
        end
        
        subgraph Hooks["State Management"]
            useChat["hooks/useChat.ts"]
        end
        
        subgraph Lib["Utilities"]
            api["lib/api.ts"]
            utils["lib/utils.ts"]
        end
    end
    
    mainTsx --> app
    app --> Components
    app --> Hooks
    Components --> UI
    Hooks --> Lib
```

## Data Flow

```mermaid
sequenceDiagram
    autonumber
    
    participant User
    participant React as React App
    participant Hook as useChat Hook
    participant API as /api/chat
    participant RAG as RAG Pipeline
    participant Chroma as ChromaDB
    participant OpenAI as OpenAI API
    
    User->>React: Types message
    React->>Hook: sendMessage()
    Hook->>Hook: Add user message to state
    Hook->>API: POST /api/chat (SSE)
    
    API->>RAG: search_foods(query, filters)
    RAG->>Chroma: collection.query()
    Chroma-->>RAG: Matching foods
    RAG-->>API: Formatted context
    
    API->>OpenAI: chat.completions.create(stream=True)
    
    loop Token by token
        OpenAI-->>API: Streaming chunk
        API-->>Hook: SSE event
        Hook->>Hook: Append to message
        Hook-->>React: Re-render
        React-->>User: See token appear
    end
    
    API-->>Hook: done event
    Hook->>Hook: setIsStreaming(false)
```

---

## Detailed File Explanations

### Backend Files

Each file is explained with its purpose, key functions, and how it connects to other parts.
