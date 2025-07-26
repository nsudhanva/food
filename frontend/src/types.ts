export interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

export interface Preferences {
    dietary_type: string
    spice_level: string
    allergies: string[]
    dislikes: string[]
    health_goals: string[]
    preferred_cuisines: string[]
}

export interface Food {
    id: string
    name: string
    description: string
    cuisine: string
    meal_type: string
    tags: string[]
    allergens: string[]
    nutrition: Record<string, number>
    spice_level: string
}
