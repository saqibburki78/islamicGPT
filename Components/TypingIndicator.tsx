"use client"

import React from 'react'
import { motion } from 'framer-motion'

const TypingIndicator: React.FC = () => {
    return (
        <div className="flex items-start gap-2 sm:gap-3 w-full">
            <div className="w-8 h-8 glass rounded-full flex items-center justify-center text-xs font-medium text-gold border border-gold/20 flex-shrink-0 font-serif">
                AI
            </div>
            <div className="glass px-4 py-3 rounded-tr-lg rounded-br-lg rounded-bl-lg rounded-tl-none border border-gold/20 flex items-center gap-1.5">
                <motion.div
                    className="w-1.5 h-1.5 bg-gold rounded-full"
                    animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                />
                <motion.div
                    className="w-1.5 h-1.5 bg-gold rounded-full"
                    animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
                />
                <motion.div
                    className="w-1.5 h-1.5 bg-gold rounded-full"
                    animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                />
            </div>
        </div>
    )
}

export default TypingIndicator
