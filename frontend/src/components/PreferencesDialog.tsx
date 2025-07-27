import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Preferences } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
    preferences: Preferences
    onUpdate: (prefs: Preferences) => void
}

const SPICE_LEVELS = [
    { value: 'mild', label: 'Mild', desc: 'Light spices' },
    { value: 'medium', label: 'Medium', desc: 'Balanced heat' },
    { value: 'spicy', label: 'Spicy', desc: 'Good kick' },
    { value: 'extra_spicy', label: 'Extra Hot', desc: 'Very spicy' },
]

const CUISINES = [
    { value: 'south_indian', label: 'South Indian' },
    { value: 'north_indian', label: 'North Indian' },
    { value: 'gujarati', label: 'Gujarati' },
    { value: 'bengali', label: 'Bengali' },
    { value: 'rajasthani', label: 'Rajasthani' },
    { value: 'maharashtrian', label: 'Maharashtrian' },
]

const ALLERGIES = [
    { value: 'dairy', label: 'Dairy', desc: 'Milk, paneer, ghee' },
    { value: 'gluten', label: 'Gluten', desc: 'Wheat, roti, naan' },
    { value: 'peanuts', label: 'Peanuts', desc: 'Groundnuts' },
    { value: 'nuts', label: 'Tree Nuts', desc: 'Cashews, almonds' },
    { value: 'sesame', label: 'Sesame', desc: 'Til seeds' },
]

const HEALTH_GOALS = [
    { value: 'weight_loss', label: 'Weight Loss' },
    { value: 'high_protein', label: 'High Protein' },
    { value: 'low_carb', label: 'Low Carb' },
    { value: 'iron_rich', label: 'Iron Rich' },
    { value: 'probiotic', label: 'Probiotic' },
]

export function PreferencesDialog({ preferences, onUpdate }: Props) {
    const [local, setLocal] = useState<Preferences>(preferences)
    const [open, setOpen] = useState(false)

    const toggleItem = (arr: string[], item: string) => {
        return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]
    }

    const handleSave = () => {
        onUpdate(local)
        setOpen(false)
    }

    const handleOpen = (isOpen: boolean) => {
        if (isOpen) {
            setLocal(preferences)
        }
        setOpen(isOpen)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Preferences
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Dietary Preferences</DialogTitle>
                    <p className="text-sm text-slate-400 mt-1">
                        Customize recommendations based on your taste and dietary needs
                    </p>
                </DialogHeader>
                <Tabs defaultValue="spice" className="mt-4">
                    <TabsList className="grid grid-cols-4 bg-slate-800/50 p-1 rounded-lg">
                        <TabsTrigger value="spice" className="data-[state=active]:bg-slate-700 rounded-md text-xs">Spice</TabsTrigger>
                        <TabsTrigger value="cuisine" className="data-[state=active]:bg-slate-700 rounded-md text-xs">Cuisine</TabsTrigger>
                        <TabsTrigger value="allergies" className="data-[state=active]:bg-slate-700 rounded-md text-xs">Allergies</TabsTrigger>
                        <TabsTrigger value="goals" className="data-[state=active]:bg-slate-700 rounded-md text-xs">Goals</TabsTrigger>
                    </TabsList>

                    <TabsContent value="spice" className="mt-4 space-y-2">
                        <p className="text-sm text-slate-400 mb-3">How spicy do you like your food?</p>
                        <div className="grid grid-cols-2 gap-2">
                            {SPICE_LEVELS.map(({ value, label, desc }) => (
                                <button
                                    key={value}
                                    onClick={() => setLocal({ ...local, spice_level: value })}
                                    className={cn(
                                        'p-3 rounded-lg border text-left transition-all',
                                        local.spice_level === value
                                            ? 'border-orange-500 bg-orange-500/10 text-white'
                                            : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                                    )}
                                >
                                    <div className="font-medium text-sm">{label}</div>
                                    <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
                                </button>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="cuisine" className="mt-4 space-y-2">
                        <p className="text-sm text-slate-400 mb-3">Select your preferred regional cuisines</p>
                        <div className="grid grid-cols-2 gap-2">
                            {CUISINES.map(({ value, label }) => (
                                <button
                                    key={value}
                                    onClick={() => setLocal({
                                        ...local,
                                        preferred_cuisines: toggleItem(local.preferred_cuisines, value)
                                    })}
                                    className={cn(
                                        'p-3 rounded-lg border text-left transition-all text-sm',
                                        local.preferred_cuisines.includes(value)
                                            ? 'border-emerald-500 bg-emerald-500/10 text-white'
                                            : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="allergies" className="mt-4 space-y-2">
                        <p className="text-sm text-slate-400 mb-3">
                            Foods with these allergens will be excluded from recommendations
                        </p>
                        <div className="space-y-2">
                            {ALLERGIES.map(({ value, label, desc }) => (
                                <button
                                    key={value}
                                    onClick={() => setLocal({
                                        ...local,
                                        allergies: toggleItem(local.allergies, value)
                                    })}
                                    className={cn(
                                        'w-full p-3 rounded-lg border text-left transition-all flex justify-between items-center',
                                        local.allergies.includes(value)
                                            ? 'border-red-500 bg-red-500/10 text-white'
                                            : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                                    )}
                                >
                                    <div>
                                        <div className="font-medium text-sm">{label}</div>
                                        <div className="text-xs text-slate-500">{desc}</div>
                                    </div>
                                    {local.allergies.includes(value) && (
                                        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="goals" className="mt-4 space-y-2">
                        <p className="text-sm text-slate-400 mb-3">Any health or nutrition goals?</p>
                        <div className="grid grid-cols-2 gap-2">
                            {HEALTH_GOALS.map(({ value, label }) => (
                                <button
                                    key={value}
                                    onClick={() => setLocal({
                                        ...local,
                                        health_goals: toggleItem(local.health_goals, value)
                                    })}
                                    className={cn(
                                        'p-3 rounded-lg border text-left transition-all text-sm',
                                        local.health_goals.includes(value)
                                            ? 'border-blue-500 bg-blue-500/10 text-white'
                                            : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-800">
                    <Button variant="ghost" onClick={() => setOpen(false)} className="text-slate-400">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white"
                    >
                        Save Preferences
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
