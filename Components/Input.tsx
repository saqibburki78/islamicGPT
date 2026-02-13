"use client"
import React, { useState, useRef, useEffect } from 'react'
import { Ban, Send } from 'lucide-react'
import { motion } from 'framer-motion'
type InputProps = {
  onSend?: (text: string) => void
  placeholder?: string
  disabled?: boolean
  isTyping?: boolean
  stop?: () => void
}

const Input: React.FC<InputProps> = ({
  onSend,
  placeholder = 'Inquire...',
  disabled = false,
  isTyping,
  stop
}) => {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [value])

  const submit = () => {
    const text = value.trim()
    if (!text || disabled) return
    // propagate text to parent
    onSend?.(text)
    setValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter, new line on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="flex justify-center px-4 md:px-8">
      <div className="relative w-full max-w-4xl">
        <div className="glass-panel transition-all duration-300 border border-gold/10 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)] bg-background/40">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full bg-transparent text-foreground placeholder-gold/30 resize-none focus:outline-none px-6 py-4 pr-16 text-base font-sans leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed max-h-50"
          />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={submit}
            // disabled={!value.trim() || disabled}
            aria-label="Send message"
            className={`absolute right-4 bottom-3.5 p-2.5 rounded-full transition-all duration-500 flex items-center justify-center ${value.trim() && !disabled
              ? 'bg-gold text-primary-foreground hover:bg-white hover:text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]'
              : 'bg-white/5 text-gray-500'
              }`}
          >
            {isTyping ? (
              <Ban onClick={stop} className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export default Input
