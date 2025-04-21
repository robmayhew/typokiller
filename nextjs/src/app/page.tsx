'use client'

import { useState, useRef } from 'react'
import FileUploader from '@/components/FileUploader'
import TextDisplay from '@/components/TextDisplay'

export default function Home() {
  const [fileContent, setFileContent] = useState<string>('')
  const [language, setLanguage] = useState<string>('')
  const [viewMode, setViewMode] = useState<string>('')
  const handleFileContent = (content: string) => {
    setFileContent(content)
  }

  const handleLanguage = (language: string) =>{
    setLanguage(language)
  }

  const handleViewMode = (viewMode: string) =>{
    setViewMode(viewMode)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">TYPO Killer</h1>
        <FileUploader onFileContent={handleFileContent} onPatchLanguageChange={handleLanguage} onViewModeChange={handleViewMode} />
        <TextDisplay content={fileContent} mode={viewMode} language={language} />
      </div>
    </main>
  )
}