# useChat.ts - Frontend State Management

This React hook manages all chat state and streaming logic. It's the bridge between UI and API.

## Complete Source

```typescript title="frontend/src/hooks/useChat.ts"
import { useState, useCallback } from 'react'
import type { Message, Preferences } from '@/types'
import { streamChat } from '@/lib/api'

export function useChat(preferences: Preferences) {
    const [messages, setMessages] = useState<Message[]>([])
    const [isStreaming, setIsStreaming] = useState(false)

    const sendMessage = useCallback(async (content: string) => {
        const userMessage: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content,
            timestamp: new Date(),
        }

        setMessages(prev => [...prev, userMessage])
        setIsStreaming(true)

        const assistantMessage: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: '',
            timestamp: new Date(),
        }

        setMessages(prev => [...prev, assistantMessage])

        try {
            for await (const chunk of streamChat(content, preferences)) {
                setMessages(prev => {
                    const updated = [...prev]
                    const lastIdx = updated.length - 1
                    updated[lastIdx] = {
                        ...updated[lastIdx],
                        content: updated[lastIdx].content + chunk,
                    }
                    return updated
                })
            }
        } catch (error) {
            console.error('Stream error:', error)
            setMessages(prev => {
                const updated = [...prev]
                const lastIdx = updated.length - 1
                updated[lastIdx] = {
                    ...updated[lastIdx],
                    content: 'Sorry, something went wrong. Please try again.',
                }
                return updated
            })
        } finally {
            setIsStreaming(false)
        }
    }, [preferences])

    const clearMessages = useCallback(() => setMessages([]), [])

    return { messages, isStreaming, sendMessage, clearMessages }
}
```

## State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle: Initial
    
    Idle --> Streaming: sendMessage()
    Streaming --> Idle: Stream complete
    Streaming --> Error: API error
    Error --> Idle: Error handled
    
    state Streaming {
        [*] --> AddUserMessage
        AddUserMessage --> AddEmptyAssistant
        AddEmptyAssistant --> AppendingTokens
        AppendingTokens --> AppendingTokens: New token
        AppendingTokens --> [*]: Done
    }
```

## Hook Interface

```mermaid
classDiagram
    class useChat {
        +Message[] messages
        +boolean isStreaming
        +sendMessage(content: string) void
        +clearMessages() void
    }
    
    class Message {
        +string id
        +string role
        +string content
        +Date timestamp
    }
    
    class Preferences {
        +string dietary_type
        +string spice_level
        +string[] allergies
        +string[] preferred_cuisines
    }
    
    useChat --> Message : manages
    useChat --> Preferences : receives
```

## Message Flow

```mermaid
sequenceDiagram
    participant User
    participant Hook as useChat
    participant State as React State
    participant API as streamChat()
    
    User->>Hook: sendMessage("breakfast")
    
    Hook->>State: Add user message
    Note over State: messages: [user msg]
    
    Hook->>State: Set isStreaming = true
    Hook->>State: Add empty assistant message
    Note over State: messages: [user, empty assistant]
    
    Hook->>API: streamChat("breakfast", prefs)
    
    loop Each token
        API-->>Hook: "Based"
        Hook->>State: Append to last message
        Note over State: assistant.content = "Based"
        
        API-->>Hook: " on"
        Hook->>State: Append to last message
        Note over State: assistant.content = "Based on"
    end
    
    API-->>Hook: Stream done
    Hook->>State: Set isStreaming = false
```

## Optimistic Updates

```mermaid
flowchart TB
    subgraph Traditional["Traditional Approach"]
        T1["User clicks send"]
        T2["Wait for API response"]
        T3["Show message"]
        T1 --> T2 --> T3
    end
    
    subgraph Optimistic["Optimistic Approach (Ours)"]
        O1["User clicks send"]
        O2["Show message immediately"]
        O3["API processes in background"]
        O1 --> O2
        O1 --> O3
    end
```

```typescript
// Immediately add user message (optimistic)
setMessages(prev => [...prev, userMessage])

// Then make API call
for await (const chunk of streamChat(...)) { ... }
```

Benefits:

- **Feels instant**: User sees their message immediately
- **No blocking**: UI stays responsive
- **Better UX**: Matches expectations from apps like ChatGPT

## Token Appending

```typescript
for await (const chunk of streamChat(content, preferences)) {
    setMessages(prev => {
        const updated = [...prev]
        const lastIdx = updated.length - 1
        updated[lastIdx] = {
            ...updated[lastIdx],
            content: updated[lastIdx].content + chunk,  // Append token
        }
        return updated
    })
}
```

**Why functional update?**

```typescript
// ❌ This can cause stale state issues
setMessages([...messages, newMsg])

// ✅ This always uses the latest state
setMessages(prev => [...prev, newMsg])
```

The functional form (`prev => ...`) guarantees you're working with the latest state, crucial for rapid updates during streaming.

## Error Handling

```mermaid
flowchart TD
    Start["Streaming"]
    
    Start --> Try["try block"]
    Try -->|Success| Done["setIsStreaming(false)"]
    Try -->|Error| Catch["catch block"]
    
    Catch --> SetError["Set error message"]
    SetError --> Finally["finally block"]
    Done --> Finally
    Finally --> End["isStreaming = false"]
```

```typescript
try {
    for await (const chunk of streamChat(...)) {
        // Append tokens
    }
} catch (error) {
    console.error('Stream error:', error)
    setMessages(prev => {
        const updated = [...prev]
        const lastIdx = updated.length - 1
        updated[lastIdx] = {
            ...updated[lastIdx],
            content: 'Sorry, something went wrong. Please try again.',
        }
        return updated
    })
} finally {
    setIsStreaming(false)  // Always runs
}
```

## useCallback Dependency

```typescript
const sendMessage = useCallback(async (content: string) => {
    // ...uses preferences
}, [preferences])  // Re-create when preferences change
```

`useCallback` memoizes the function:

- Same function reference if `preferences` unchanged
- Prevents unnecessary re-renders of child components

```mermaid
flowchart LR
    subgraph Without["Without useCallback"]
        W1["Parent renders"]
        W2["New function created"]
        W3["Child sees 'new' prop"]
        W4["Child re-renders"]
        W1 --> W2 --> W3 --> W4
    end
    
    subgraph With["With useCallback"]
        C1["Parent renders"]
        C2["Same function reference"]
        C3["Child sees same prop"]
        C4["Child skips render"]
        C1 --> C2 --> C3 --> C4
    end
```

## Integration with App.tsx

```typescript title="App.tsx usage"
function App() {
    const [preferences, setPreferences] = useState<Preferences>(...)
    
    // Hook provides all chat state
    const { messages, isStreaming, sendMessage, clearMessages } = useChat(preferences)
    
    return (
        <div>
            {messages.map(msg => <ChatMessage message={msg} />)}
            <ChatComposer onSend={sendMessage} disabled={isStreaming} />
        </div>
    )
}
```

---

Next, let's look at the frontend streaming API client.
