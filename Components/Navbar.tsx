"use client"
import React from 'react'
import { Menu } from 'lucide-react'
import ModelSelector from './ModelSelector'

type NavbarProps = {
  onToggleSidebar?: () => void
  onModelChange?: (modelId: string) => void
  selectedModel?: string
  isSidebarOpen?: boolean
}

const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onModelChange,
  selectedModel,
  isSidebarOpen
}) => {
  return (
    <nav className="sticky top-0 z-30 w-full glass-navbar text-white">
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3 sm:px-4 lg:px-8">

        {/* Left: Menu + Logo + Brand */}
        {!isSidebarOpen && (
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onToggleSidebar}
              className="p-2 sm:p-2 rounded-xl glass-light hover:glow-hover transition-all duration-300 text-gray-600 hover:text-gray-900 touch-manipulation"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-700 via-gray-800 to-gray-600 bg-clip-text text-white">
              Lillith
            </h1>
          </div>
        )}
        {/* Right: Model Selector */}
        <div className="fixed right-6 items-center text-white">
          <ModelSelector selectedModel={selectedModel} onModelChange={onModelChange} />
        </div>
      </div>
    </nav>
  )
}

export default Navbar