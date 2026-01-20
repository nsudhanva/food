# Chat Interface

Let's build the main chat interface - the heart of our application.

## Component Overview

```
┌──────────────────────────────────────────┐
│ Header                                   │
│ Logo - Title - Preferences Button        │
├──────────────────────────────────────────┤
│                                          │
│ Chat Messages                            │
│ ┌──────────────────────────────────────┐ │
│ │ User: What should I eat?             │ │
│ └──────────────────────────────────────┘ │
│ ┌──────────────────────────────────────┐ │
│ │ Assistant: Based on your...          │ │
│ └──────────────────────────────────────┘ │
│                                          │
├──────────────────────────────────────────┤
│ Chat Composer                            │
│ [Text input........................] [→] │
└──────────────────────────────────────────┘
```

## Step 1: Header Component

Create `src/components/Header.tsx`:

```typescript title="src/components/Header.tsx"
import { Button } from '@/components/ui/button';
import type { Preferences } from '@/types';

interface HeaderProps {
  preferences: Preferences;
  onOpenPreferences: () => void;
  onClearChat: () => void;
  hasMessages: boolean;
}

export function Header({
  onOpenPreferences,
  onClearChat,
  hasMessages,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6 max-w-4xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
            <span className="text-lg font-bold text-white">M</span>
          </div>
          <div>
            <h1 className="text-base font-semibold text-white">Maanasa</h1>
            <span className="text-xs text-slate-500">Indian Food Expert</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onOpenPreferences}>
            Preferences
          </Button>
          {hasMessages && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearChat}
              className="text-slate-400 hover:text-red-400"
            >
              Clear
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
```

## Step 2: Chat Message Component

Create `src/components/ChatMessage.tsx`:

```typescript title="src/components/ChatMessage.tsx"
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '@/types';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-4 py-6 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-slate-700'
            : 'bg-gradient-to-br from-orange-500 to-amber-600'
        }`}
      >
        <span className="text-sm font-medium text-white">
          {isUser ? 'U' : 'M'}
        </span>
      </div>

      {/* Content */}
      <div
        className={`flex-1 ${
          isUser ? 'text-right' : ''
        }`}
      >
        {isUser ? (
          <p className="text-slate-200 inline-block bg-slate-800 rounded-2xl px-4 py-2">
            {message.content}
          </p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Markdown Rendering

We use `react-markdown` with `remark-gfm` for GitHub Flavored Markdown:

```bash
bun add react-markdown remark-gfm
```

This renders:

- **Bold**, *italic*, ~~strikethrough~~
- Lists (ordered and unordered)
- Code blocks with syntax highlighting
- Tables
- Links

## Step 3: Chat Composer

Create `src/components/ChatComposer.tsx`:

```typescript title="src/components/ChatComposer.tsx"
import { useState, useRef, KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface ChatComposerProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Enter sends, Shift+Enter adds newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-3">
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about Indian dishes..."
        disabled={disabled}
        className="flex-1 min-h-[56px] max-h-32 resize-none"
        rows={1}
      />
      <Button
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        className="h-14 w-14 rounded-xl"
      >
        {disabled ? (
          <LoadingSpinner />
        ) : (
          <SendIcon />
        )}
      </Button>
    </div>
  );
}

function SendIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
      />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
```

## Step 4: Empty State

When there are no messages, show starter prompts:

```typescript title="src/components/EmptyState.tsx"
interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

const STARTER_PROMPTS = [
  { text: 'Breakfast ideas', prompt: 'What should I have for breakfast?' },
  { text: 'Something healthy', prompt: 'I want something light and healthy' },
  { text: 'Spicy dishes', prompt: 'I am craving something spicy' },
  { text: 'Popular dishes', prompt: 'What are the most popular Indian dishes?' },
];

export function EmptyState({ onSelectPrompt }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-600/20 flex items-center justify-center mb-8">
        <svg
          className="w-10 h-10 text-orange-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-white mb-3">
        What would you like to eat?
      </h2>
      <p className="text-slate-400 max-w-md mb-8">
        Discover authentic Indian vegetarian dishes tailored to your taste.
      </p>

      <div className="grid grid-cols-2 gap-3 max-w-md">
        {STARTER_PROMPTS.map(({ text, prompt }) => (
          <button
            key={text}
            onClick={() => onSelectPrompt(prompt)}
            className="px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 text-sm hover:border-orange-500/50 hover:text-white transition-all"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
```

## Putting It Together

Preview of how these components connect in `App.tsx`:

```typescript
import { Header } from '@/components/Header';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatComposer } from '@/components/ChatComposer';
import { EmptyState } from '@/components/EmptyState';

function App() {
  return (
    <div className="flex flex-col h-screen">
      <Header {...headerProps} />
      
      <main className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState onSelectPrompt={sendMessage} />
        ) : (
          <div className="max-w-4xl mx-auto px-4 py-6">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
          </div>
        )}
      </main>
      
      <div className="border-t border-slate-800 p-4">
        <div className="max-w-4xl mx-auto">
          <ChatComposer onSend={sendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}
```

---

Next, let's implement the streaming response handling.
