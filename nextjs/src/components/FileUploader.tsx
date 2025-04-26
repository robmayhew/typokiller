'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { isPatchFile } from '@/lib/PatchDetector'
import { supportedPatchLanguages } from '@/lib/SupportedLanguages'
import { supportedReadModes } from '@/lib/SupportedReadModes'

interface FileUploaderProps {
  onFileContent: (content: string) => void
  onPatchLanguageChange: (lang: string ) => void
  onViewModeChange: (mode: string ) => void
}



export default function FileUploader({ onFileContent, onPatchLanguageChange, onViewModeChange }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [patchDetected, setPatchDetected] = useState(false)
  const [patchLanguage, setPatchLanguage] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.length) {
      readFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      readFile(e.target.files[0])
    }
  }

  const handlePatchLanguageChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setPatchLanguage(e.target.value)
    onPatchLanguageChange(e.target.value)
  }

  const handleViewModeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setViewMode(e.target.value)
    onViewModeChange(e.target.value)
  }

  const readFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const isPatch = isPatchFile(content)
      setPatchDetected(isPatch)
      setPatchLanguage(isPatch ? supportedPatchLanguages.JAVASCRIPT : supportedPatchLanguages.TEXT)
      if(!isPatch)
      {
        setViewMode(supportedReadModes.ENTIRE_FILE);
        onViewModeChange(supportedReadModes.ENTIRE_FILE);
      }
      onFileContent(content)

    }
    reader.readAsText(file)
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full mb-8">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <p className="mb-2">Drag & drop a text file here</p>
        <p className="text-sm text-gray-500">or</p>
        <button 
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            handleButtonClick()
          }}
        >
          Select a file
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          className="hidden"
          accept=".txt,.md,.js,.ts,.html,.css,.json,.patch"
        />
      </div>

      { (
        <div className="mt-4">
          <label className="block mb-1 font-medium">Detected Patch File – Choose Language:</label>
          <select
            value={patchLanguage ?? ''}
            onChange={handlePatchLanguageChange}
            className="border rounded p-2"
          >
            {Object.entries(supportedPatchLanguages).map(([key,value]) => (
              <option key={key} value={value}>
                {value}
              </option>
            ))}
          </select>
          <label className="block mb-1 font-medium">Choose Mode:</label>
          <select
              value={viewMode ?? ''}
              onChange={handleViewModeChange}
              className="border rounded p-2"
          >
            {
              Object.entries(supportedReadModes).map(([key, value]) => (
                  <option key={key} value={value}>
                    {value}
                  </option>
                  )
              )
            }
          </select>
        </div>
      )}
    </div>
  )
}
