import type { Preferences } from '@/types'

const API_URL = '/api'

export async function* streamChat(message: string, preferences: Preferences) {
    const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, preferences }),
    })

    if (!response.ok) throw new Error('Chat request failed')
    if (!response.body) throw new Error('No response body')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (!data || data === '[DONE]') continue

                try {
                    const parsed = JSON.parse(data)
                    if (parsed.content) yield parsed.content
                } catch (e) {
                    // Ignore parsing errors for empty/malformed lines
                    console.debug('SSE parse error:', e)
                }
            }
        }
    }
}

export async function getPreferences(userId: string): Promise<Preferences> {
    const response = await fetch(`${API_URL}/preferences/${userId}`)
    return response.json()
}

export async function updatePreferences(userId: string, prefs: Partial<Preferences>): Promise<Preferences> {
    const response = await fetch(`${API_URL}/preferences/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
    })
    return response.json()
}
