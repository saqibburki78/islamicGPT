"use client"
import React, { useState } from 'react'
import Chat from '@/Components/Chat'
import Navbar from '@/Components/Navbar'
const Page = () => {
  const [selectedModel, setSelectedModel] = useState('gpt-4')


  return (
    <>
      <div className="flex flex-col h-screen">
        <Navbar
          onModelChange={setSelectedModel}
          selectedModel={selectedModel}
        />
        <div className="flex-1 overflow-hidden">
          <Chat />
        </div>
      </div>
    </>
  )
}

export default Page
