# React Setup

Now let's build the frontend. We'll create a modern chat interface using React, Vite, and shadcn/ui.

## Project Structure

```
frontend/
├── src/
│   ├── main.tsx          # Entry point
│   ├── App.tsx           # Main component
│   ├── App.css           # App styles
│   ├── index.css         # Global styles (Tailwind)
│   ├── types.ts          # TypeScript types
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── ChatComposer.tsx
│   │   ├── PreferencesDialog.tsx
│   │   └── ui/           # shadcn components
│   ├── hooks/
│   │   └── useChat.ts    # Chat state management
│   └── lib/
│       ├── utils.ts      # Utility functions
│       └── api.ts        # API client
└── ...config files
```

## Step 1: Types

Create `src/types.ts`:

```typescript title="src/types.ts"
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Preferences {
  dietary_type: string;
  spice_level: string;
  allergies: string[];
  dislikes: string[];
  health_goals: string[];
  preferred_cuisines: string[];
}
```

## Step 2: Utilities

Create `src/lib/utils.ts`:

```typescript title="src/lib/utils.ts"
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(7);
}
```

The `cn` function merges Tailwind classes intelligently:

```typescript
cn('px-4 py-2', 'px-6')  // Returns 'py-2 px-6' (px-6 wins)
cn('bg-red-500', conditional && 'bg-blue-500')  // Conditional classes
```

## Step 3: API Client

Create `src/lib/api.ts`:

```typescript title="src/lib/api.ts"
import type { Preferences } from '@/types';

export async function* streamChat(
  message: string,
  preferences: Preferences
): AsyncGenerator<string, void, unknown> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, preferences }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          
          if (data.error) {
            throw new Error(data.error);
          }
          
          if (data.content) {
            yield data.content;
          }
          
          if (data.done) {
            return;
          }
        } catch (e) {
          // Ignore JSON parse errors for incomplete chunks
        }
      }
    }
  }
}
```

### Understanding the Stream Client

This is an **async generator** that yields tokens as they arrive:

```typescript
// Usage
for await (const token of streamChat(message, prefs)) {
  setContent(prev => prev + token);  // Append each token
}
```

Key parts:

1. **Fetch with streaming** - We read the response body incrementally
2. **Parse SSE format** - Extract JSON from `data: {...}` lines
3. **Yield tokens** - Each token is yielded to the caller
4. **Handle completion** - Return when `done: true` is received

## Step 4: Entry Point

Update `src/main.tsx`:

```typescript title="src/main.tsx"
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## Step 5: Global Styles

Your `src/index.css` should have:

```css title="src/index.css"
@import "tailwindcss";

@theme {
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --color-slate-950: #020617;
  --color-slate-900: #0f172a;
  --color-slate-800: #1e293b;
  --color-slate-700: #334155;
  --color-slate-600: #475569;
  --color-slate-500: #64748b;
  --color-slate-400: #94a3b8;
  --color-slate-300: #cbd5e1;
  --color-orange-500: #f97316;
  --color-orange-600: #ea580c;
  --color-amber-500: #f59e0b;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #root {
  height: 100%;
}

body {
  font-family: var(--font-sans);
  background: #020617;
  color: #f1f5f9;
  -webkit-font-smoothing: antialiased;
}

::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 4px;
}
```

## Step 6: Path Aliases

Make sure your `tsconfig.app.json` has path aliases:

```json title="tsconfig.app.json"
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

And `vite.config.ts`:

```typescript title="vite.config.ts"
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
```

The proxy routes `/api/*` requests to the backend during development.

## Verify Setup

```bash
cd frontend
bun run dev
```

Open [http://localhost:5173](http://localhost:5173). You should see an empty page (we haven't built App.tsx yet).

---

Next, let's add shadcn/ui components.
