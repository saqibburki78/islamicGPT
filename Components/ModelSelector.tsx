"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Sparkles } from 'lucide-react'

type Model = {
    id: string
    name: string
    description: string
}

const models: Model[] = [
    { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model' },
    { id: 'gpt-3.5', name: 'GPT-3.5 Turbo', description: 'Fast and efficient' },
    { id: 'claude-3', name: 'Claude 3', description: 'Thoughtful responses' },
]

type ModelSelectorProps = {
    selectedModel?: string
    onModelChange?: (modelId: string) => void
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
    selectedModel = 'gpt-4',
    onModelChange
}) => {
    const [isOpen, setIsOpen] = useState(false)
    const selected = models.find(m => m.id === selectedModel) || models[0]

    const handleSelect = (modelId: string) => {
        onModelChange?.(modelId)
        setIsOpen(false)
    }

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gold/20 bg-gold/5 text-gold hover:bg-gold/10 transition-all font-serif tracking-tight"
            >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">{selected.name}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-30"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Menu */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="absolute top-full right-0 mt-2 w-[280px] sm:w-64 rounded-xl shadow-2xl z-40 overflow-hidden glass-panel border border-gold/20"
                        >
                            <div className="p-2">
                                <div className="px-3 py-2 text-xs font-serif text-gold/50 uppercase tracking-widest border-b border-gold/10 mb-1">
                                    Select Intelligence
                                </div>
                                {models.map((model) => (
                                    <button
                                        key={model.id}
                                        onClick={() => handleSelect(model.id)}
                                        className={`w-full text-left px-3 py-3 rounded-lg transition-all duration-300 group ${model.id === selectedModel
                                            ? 'bg-gold/10 text-gold'
                                            : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium font-serif">{model.name}</div>
                                                <div className="text-xs opacity-70 truncate font-sans">{model.description}</div>
                                            </div>
                                            {model.id === selectedModel && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="w-1.5 h-1.5 bg-gold rounded-full flex-shrink-0"
                                                />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}

export default ModelSelector
