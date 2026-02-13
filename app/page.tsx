"use client"
import React, { useState } from 'react'
import Chat from '@/Components/Chat'
import Navbar from '@/Components/Navbar'
const Page = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState('gpt-4')


  return (
    <>
      <div className="flex flex-col h-screen">
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onModelChange={setSelectedModel}
          selectedModel={selectedModel}
          isSidebarOpen={isSidebarOpen}
        />
        <div className="flex-1 overflow-hidden">
          <Chat isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        </div>
      </div>
    </>
  )
}

export default Page
