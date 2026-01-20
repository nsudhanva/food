# Preferences Management

Preferences allow users to personalize their food recommendations. We'll store them in localStorage for persistence.

## The Preferences Dialog

Create `src/components/PreferencesDialog.tsx`:

```typescript title="src/components/PreferencesDialog.tsx"
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Preferences } from '@/types';

interface PreferencesDialogProps {
  preferences: Preferences;
  onUpdate: (prefs: Preferences) => void;
}

const SPICE_LEVELS = ['mild', 'medium', 'hot'];
const CUISINES = [
  'south_indian',
  'north_indian',
  'gujarati',
  'bengali',
  'maharashtrian',
  'rajasthani',
];
const ALLERGENS = ['dairy', 'nuts', 'gluten', 'soy', 'sesame'];
const HEALTH_GOALS = ['high_protein', 'low_carb', 'low_calorie'];

export function PreferencesDialog({ preferences, onUpdate }: PreferencesDialogProps) {
  const [open, setOpen] = useState(false);
  const [localPrefs, setLocalPrefs] = useState(preferences);

  const handleSave = () => {
    onUpdate(localPrefs);
    setOpen(false);
  };

  const toggleArrayItem = (
    key: 'allergies' | 'health_goals' | 'preferred_cuisines',
    item: string
  ) => {
    setLocalPrefs((prev) => {
      const current = prev[key] || [];
      const updated = current.includes(item)
        ? current.filter((i) => i !== item)
        : [...current, item];
      return { ...prev, [key]: updated };
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Preferences
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Your Preferences</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="spice">
          <TabsList className="w-full">
            <TabsTrigger value="spice" className="flex-1">Spice</TabsTrigger>
            <TabsTrigger value="cuisine" className="flex-1">Cuisine</TabsTrigger>
            <TabsTrigger value="dietary" className="flex-1">Dietary</TabsTrigger>
          </TabsList>

          <TabsContent value="spice">
            <div className="space-y-3">
              <p className="text-sm text-slate-400">
                How spicy do you like your food?
              </p>
              <div className="flex gap-2">
                {SPICE_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() =>
                      setLocalPrefs((p) => ({ ...p, spice_level: level }))
                    }
                    className={`flex-1 py-2 rounded-lg border transition-all ${
                      localPrefs.spice_level === level
                        ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                        : 'border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cuisine">
            <div className="space-y-3">
              <p className="text-sm text-slate-400">
                Select your favorite cuisines
              </p>
              <div className="grid grid-cols-2 gap-2">
                {CUISINES.map((cuisine) => (
                  <button
                    key={cuisine}
                    onClick={() => toggleArrayItem('preferred_cuisines', cuisine)}
                    className={`py-2 px-3 rounded-lg border text-sm transition-all ${
                      localPrefs.preferred_cuisines?.includes(cuisine)
                        ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                        : 'border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {cuisine.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dietary">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400 mb-2">Allergies / Avoid</p>
                <div className="flex flex-wrap gap-2">
                  {ALLERGENS.map((allergen) => (
                    <button
                      key={allergen}
                      onClick={() => toggleArrayItem('allergies', allergen)}
                      className={`py-1.5 px-3 rounded-full text-sm transition-all ${
                        localPrefs.allergies?.includes(allergen)
                          ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {allergen}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-2">Health Goals</p>
                <div className="flex flex-wrap gap-2">
                  {HEALTH_GOALS.map((goal) => (
                    <button
                      key={goal}
                      onClick={() => toggleArrayItem('health_goals', goal)}
                      className={`py-1.5 px-3 rounded-full text-sm transition-all ${
                        localPrefs.health_goals?.includes(goal)
                          ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {goal.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## localStorage Persistence

In `App.tsx`, we persist preferences:

```typescript title="src/App.tsx (preferences section)"
import { useState, useEffect } from 'react';
import type { Preferences } from '@/types';

const DEFAULT_PREFERENCES: Preferences = {
  dietary_type: 'vegetarian',
  spice_level: 'medium',
  allergies: [],
  dislikes: [],
  health_goals: [],
  preferred_cuisines: ['south_indian', 'north_indian'],
};

function App() {
  // Load from localStorage on mount
  const [preferences, setPreferences] = useState<Preferences>(() => {
    const stored = localStorage.getItem('food-preferences');
    return stored ? JSON.parse(stored) : DEFAULT_PREFERENCES;
  });

  // Save to localStorage when preferences change
  useEffect(() => {
    localStorage.setItem('food-preferences', JSON.stringify(preferences));
  }, [preferences]);

  // ...
}
```

### Lazy Initial State

```typescript
const [preferences, setPreferences] = useState<Preferences>(() => {
  // This function only runs once on mount
  const stored = localStorage.getItem('food-preferences');
  return stored ? JSON.parse(stored) : DEFAULT_PREFERENCES;
});
```

Using a function in `useState` (lazy initialization) prevents reading localStorage on every render.

## Preferences Summary

Show active preferences at a glance:

```typescript title="src/components/PreferencesSummary.tsx"
import { Badge } from '@/components/ui/badge';
import type { Preferences } from '@/types';

interface PreferencesSummaryProps {
  preferences: Preferences;
}

export function PreferencesSummary({ preferences }: PreferencesSummaryProps) {
  const hasFilters =
    preferences.allergies?.length > 0 ||
    preferences.health_goals?.length > 0;

  if (!hasFilters) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800/50">
      <span className="text-xs text-slate-500">Active filters:</span>
      <div className="flex flex-wrap gap-1">
        {preferences.spice_level && (
          <Badge variant="secondary">{preferences.spice_level} spice</Badge>
        )}
        {preferences.allergies?.map((a) => (
          <Badge key={a} variant="outline" className="text-red-400 border-red-500/30">
            No {a}
          </Badge>
        ))}
        {preferences.health_goals?.map((g) => (
          <Badge key={g} variant="outline" className="text-green-400 border-green-500/30">
            {g.replace('_', ' ')}
          </Badge>
        ))}
      </div>
    </div>
  );
}
```

## Complete App.tsx

Here's how everything comes together:

```typescript title="src/App.tsx"
import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatComposer } from '@/components/ChatComposer';
import { EmptyState } from '@/components/EmptyState';
import { PreferencesDialog } from '@/components/PreferencesDialog';
import { PreferencesSummary } from '@/components/PreferencesSummary';
import { useChat } from '@/hooks/useChat';
import type { Preferences } from '@/types';

const DEFAULT_PREFERENCES: Preferences = {
  dietary_type: 'vegetarian',
  spice_level: 'medium',
  allergies: [],
  dislikes: [],
  health_goals: [],
  preferred_cuisines: ['south_indian', 'north_indian'],
};

function App() {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    const stored = localStorage.getItem('food-preferences');
    return stored ? JSON.parse(stored) : DEFAULT_PREFERENCES;
  });

  const { messages, isStreaming, sendMessage, clearMessages } = useChat(preferences);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Persist preferences
  useEffect(() => {
    localStorage.setItem('food-preferences', JSON.stringify(preferences));
  }, [preferences]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200">
      <Header
        preferences={preferences}
        onOpenPreferences={() => {}}  // Dialog handles its own state
        onClearChat={clearMessages}
        hasMessages={messages.length > 0}
      />
      
      <PreferencesSummary preferences={preferences} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 pb-32 pt-6">
          {messages.length === 0 ? (
            <EmptyState onSelectPrompt={sendMessage} />
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isStreaming && (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-75" />
                    <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-150" />
                  </div>
                  <span>Thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent pt-8 pb-6 px-4">
        <div className="max-w-4xl mx-auto">
          <ChatComposer onSend={sendMessage} disabled={isStreaming} />
          <p className="text-center text-xs text-slate-600 mt-3">
            AI can make mistakes. Verify important dietary information.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
```

---

That completes the frontend! The next section covers deployment.
