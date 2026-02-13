"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, MessageSquare, X } from 'lucide-react'

type Conversation = {
    id: string
    title: string
}

type SidebarProps = {
    isOpen: boolean
    conversations: Conversation[]
    selectedId: string
    onSelectConversation: (id: string) => void
    onNewConversation: () => void
    onClose: () => void
}

const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    conversations,
    selectedId,
    onSelectConversation,
    onNewConversation,
    onClose
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Mobile overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                        onClick={onClose}
                    />

                    {/* Sidebar */}
                    <motion.aside
                        initial={{ x: -320 }}
                        animate={{ x: 0 }}
                        exit={{ x: -320 }}
                        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                        className="fixed top-0 left-0 h-full w-70 sm:w-[320px] lg:w-70 glass-sidebar z-50 flex flex-col border-r border-gold/20"
                    >
                        {/* Header */}
                        <div className="p-7 flex items-center justify-between border-b border-gold/10">
                            <h2 className="hidden lg:block text-xl font-serif tracking-tight text-gold italic">Costimize AI</h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-gold/10 transition-colors text-muted-foreground hover:text-gold"
                                aria-label="Close sidebar"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex flex-col">
                        <label htmlFor="systemPrompt">System Prompt</label>
                        <textarea name='systemPrompt' rows={6} className='whitespace-nowrap focus:outline-none border-amber-50 border-2 shadow-2xl resize-none'></textarea>
                        <label htmlFor="Temprature">Temprature</label>
                        <input type="range" id="temprature" name="temprature" min="0" max="5" step="0.1" className='w-full bg-amber-50'/>
                       <label htmlFor="N-point">N-point</label>
                        <input type="range" id="n-point" name="n-point" min="0" max="5" step="1" className='w-full bg-amber-50'/>
                        
                     </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    )
}

export default Sidebar