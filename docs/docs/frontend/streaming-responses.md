# Streaming Responses

The magic of our chat app is the real-time streaming response, just like ChatGPT. Let's implement it.

## The useChat Hook

Create `src/hooks/useChat.ts`:

```typescript title="src/hooks/useChat.ts"
import { useState, useCallback } from 'react';
import { streamChat } from '@/lib/api';
import { generateId } from '@/lib/utils';
import type { Message, Preferences } from '@/types';

export function useChat(preferences: Preferences) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(
    async (content: string) => {
      // Don't send if already streaming
      if (isStreaming) return;

      // Add user message immediately
      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Create placeholder for assistant response
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Start streaming
      setIsStreaming(true);

      try {
        for await (const token of streamChat(content, preferences)) {
          // Update the assistant message with each token
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id
                ? { ...msg, content: msg.content + token }
                : msg
            )
          );
        }
      } catch (error) {
        // Update with error message
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? { ...msg, content: 'Sorry, an error occurred. Please try again.' }
              : msg
          )
        );
        console.error('Chat error:', error);
      } finally {
        setIsStreaming(false);
      }
    },
    [preferences, isStreaming]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isStreaming,
    sendMessage,
    clearMessages,
  };
}
```

## Understanding the Flow

```
1. User types message, clicks send
   ↓
2. Add user message to state immediately
   ↓
3. Add empty assistant message (placeholder)
   ↓
4. Start streaming from API
   ↓
5. For each token received:
   - Find the assistant message
   - Append the token to its content
   - Trigger re-render
   ↓
6. Stream complete → setIsStreaming(false)
```

## State Updates Explained

### Adding Messages

```typescript
// Add user message
setMessages((prev) => [...prev, userMessage]);

// Add assistant placeholder
setMessages((prev) => [...prev, assistantMessage]);
```

We use the callback form `(prev) => newState` to ensure we have the latest state.

### Updating During Stream

```typescript
for await (const token of streamChat(...)) {
  setMessages((prev) =>
    prev.map((msg) =>
      msg.id === assistantMessage.id
        ? { ...msg, content: msg.content + token }  // Append token
        : msg  // Keep other messages unchanged
    )
  );
}
```

This:

1. Iterates through all messages
2. Finds the assistant message by ID
3. Appends the new token to its content
4. Returns all messages (triggering re-render)

## The API Stream Function

Already created in `src/lib/api.ts`:

```typescript
export async function* streamChat(
  message: string,
  preferences: Preferences
): AsyncGenerator<string, void, unknown> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, preferences }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (data.content) {
          yield data.content;  // Yield each token
        }
        if (data.done) {
          return;  // End the generator
        }
      }
    }
  }
}
```

### Async Generator Pattern

```typescript
async function* streamChat(): AsyncGenerator<string> {
  // ...
  yield token;  // Pause and return a value
  // ...
}

// Consumer
for await (const token of streamChat(...)) {
  // Each yield resumes here
  console.log(token);
}
```

## Auto-Scroll

To scroll to the bottom as new content arrives:

```typescript title="In App.tsx"
import { useEffect, useRef } from 'react';

function App() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isStreaming, sendMessage } = useChat(preferences);

  // Auto-scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isStreaming && (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <span className="animate-pulse">Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />  {/* Scroll target */}
      </div>
    </main>
  );
}
```

## Error States

The hook handles errors gracefully:

```typescript
try {
  for await (const token of streamChat(...)) {
    // ... update messages
  }
} catch (error) {
  setMessages((prev) =>
    prev.map((msg) =>
      msg.id === assistantMessage.id
        ? { ...msg, content: 'Sorry, an error occurred.' }
        : msg
    )
  );
}
```

The user sees an error message instead of a broken state.

## Optimistic UI

We add the user message **before** the API call completes:

```typescript
// Immediate feedback
setMessages((prev) => [...prev, userMessage]);

// Then make the API call
for await (const token of streamChat(...)) {
```

This makes the app feel fast - users see their message immediately.

## Disable During Streaming

Prevent sending while a response is in progress:

```typescript
<ChatComposer
  onSend={sendMessage}
  disabled={isStreaming}  // Disable input during streaming
/>
```

The hook also checks:

```typescript
const sendMessage = useCallback(async (content: string) => {
  if (isStreaming) return;  // Guard clause
  // ...
}, [isStreaming]);
```

---

Next, let's implement the preferences management.
