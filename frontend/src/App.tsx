import { useState, useEffect, useRef } from 'react'
import { ChatMessage } from '@/components/ChatMessage'
import { ChatComposer } from '@/components/ChatComposer'
import { PreferencesSummary } from '@/components/PreferencesSummary'
import { Header } from '@/components/Header'
import { useChat } from '@/hooks/useChat'
import type { Preferences } from '@/types'
import './App.css'

const DEFAULT_PREFERENCES: Preferences = {
  dietary_type: 'vegetarian',
  spice_level: 'medium',
  allergies: [],
  dislikes: [],
  health_goals: [],
  preferred_cuisines: ['south_indian', 'north_indian'],
}

const STARTER_PROMPTS = [
  { icon: 'sun', text: 'Breakfast ideas', prompt: 'What should I have for breakfast?' },
  { icon: 'leaf', text: 'Something healthy', prompt: 'I want something light and healthy' },
  { icon: 'flame', text: 'Spicy dishes', prompt: 'I am craving something spicy' },
  { icon: 'star', text: 'Popular dishes', prompt: 'What are the most popular Indian dishes?' },
]

function App() {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    const stored = localStorage.getItem('food-preferences')
    return stored ? JSON.parse(stored) : DEFAULT_PREFERENCES
  })

  const { messages, isStreaming, sendMessage, clearMessages } = useChat(preferences)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem('food-preferences', JSON.stringify(preferences))
  }, [preferences])

  // Improved auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isStreaming])

  const getIcon = (name: string) => {
    switch (name) {
      case 'sun': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
      case 'leaf': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
      case 'flame': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>
      case 'star': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
      default: return null
    }
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#020617] text-slate-200">

      {/* 1. Sticky Header */}
      <Header
        preferences={preferences}
        onUpdatePreferences={setPreferences}
        onClearChat={clearMessages}
        hasMessages={messages.length > 0}
      />

      {/* 2. Scrollable Main Content */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth">
        <div className="max-w-4xl mx-auto w-full px-4 pb-32 pt-6">

          {/* Preferences Summary - Always visible at top of content */}
          <div className="mb-6">
            <PreferencesSummary preferences={preferences} />
          </div>

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center slide-up-fade">
              <div className="relative w-24 h-24 mb-8 group cursor-default">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-amber-600/20 rounded-3xl rotate-3 group-hover:rotate-6 transition-transform duration-300 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-tl from-orange-500/20 to-amber-600/20 rounded-3xl -rotate-3 group-hover:-rotate-6 transition-transform duration-300 pointer-events-none" />
                <div className="relative bg-slate-900/50 backdrop-blur border border-white/5 rounded-2xl w-full h-full flex items-center justify-center shadow-xl">
                  <svg className="w-10 h-10 text-orange-400 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>

              <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mb-4 tracking-tight">
                What would you like to eat?
              </h2>
              <p className="text-slate-400 max-w-md mb-12 text-lg leading-relaxed font-light">
                Discover authentic Indian vegetarian dishes tailored to your taste and dietary needs.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full px-4">
                {STARTER_PROMPTS.map(({ icon, text, prompt }) => (
                  <button
                    key={text}
                    onClick={() => sendMessage(prompt)}
                    className="group relative flex items-center gap-4 px-6 py-5 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-orange-500/30 hover:bg-slate-800/60 transition-all duration-300 text-left overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative p-2 rounded-lg bg-orange-500/10 text-orange-400 group-hover:scale-110 transition-transform duration-300">
                      {getIcon(icon)}
                    </span>
                    <div className="relative">
                      <span className="block text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                        {text}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {isStreaming && (
                <div className="flex items-center gap-3 px-4 py-3 text-slate-400 text-sm animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500/10 to-amber-500/10 flex items-center justify-center border border-orange-500/10">
                    <div className="flex gap-1">
                      <span className="w-1 h-1 bg-orange-400 rounded-full animate-bounce delay-75" />
                      <span className="w-1 h-1 bg-orange-400 rounded-full animate-bounce delay-150" />
                      <span className="w-1 h-1 bg-orange-400 rounded-full animate-bounce delay-300" />
                    </div>
                  </div>
                  <span className="font-medium text-slate-500">Maanasa is thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>
      </main>

      {/* 3. Fixed Bottom Composer */}
      <div className="relative z-20 bg-gradient-to-t from-[#020617] via-[#020617] to-transparent pt-10 pb-6 px-4">
        <div className="max-w-4xl mx-auto w-full">
          <ChatComposer onSend={sendMessage} disabled={isStreaming} />
          <p className="text-center text-xs text-slate-600 mt-3 font-medium">
            AI can make mistakes. Please verify important dietary information.
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
