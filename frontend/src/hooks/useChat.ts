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
