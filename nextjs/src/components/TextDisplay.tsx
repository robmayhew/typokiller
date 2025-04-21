'use client'

import {useEffect, useRef, useState} from 'react'
import {fetchModel, Line, ReadingModel, Token} from '@/lib/readingModel'

interface TextDisplayProps {
    content: string
    mode: string
    language: string
}

export default function TextDisplay({content, language, mode}: TextDisplayProps) {
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [currentLineIndex, setCurrentLineIndex] = useState<number>(0)
    const [rate, setRate] = useState<number>(1)

    let model: ReadingModel = fetchModel(language, mode)
    const lines: Line[] = model.tokenize(content, mode)

    let flatTokens: Token[] = []
    let currentCharIndex = 0
    const linesForSpeech: string[] = []

    lines.forEach((line) => {
        let lineForSpeech = ''
        line.lineTokens.forEach((token) => {
            token.speechCharStart = currentCharIndex
            flatTokens.push(token)

            if (token.text.length === 1) {
                lineForSpeech += token.text
                currentCharIndex += 1
            } else {
                lineForSpeech += ' ' + token.text + ' '
                currentCharIndex += token.text.length + 2
            }
        })
        linesForSpeech.push(lineForSpeech.trim())
    })

    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
    const lineIndexRef = useRef<number>(0)

    const speakCurrentLine = () => {
        if (lineIndexRef.current >= linesForSpeech.length) {
            console.log(`No longer speaking ${lineIndexRef.current} >= ${linesForSpeech.length}`)
            setIsSpeaking(false)
            return
        }

        const text = linesForSpeech[lineIndexRef.current];
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = rate
        utterance.onend = () => {
            console.log(`Ended. Is speaking ${isSpeaking}`);
            // TODO: Why??? this should be in sync?
            //if (isSpeaking) {
                lineIndexRef.current += 1
                console.log(`Current line changed to ${lineIndexRef.current}`);
                setCurrentLineIndex(lineIndexRef.current)
                console.log(`About to speak current line ${currentLineIndex}`);
                speakCurrentLine()
           // }
        }

        utteranceRef.current = utterance
        console.log(`Speaking ${text} line # ${lineIndexRef.current}`);
        window.speechSynthesis.speak(utterance)
    }

    const handleSpeak = () => {
        if (!content) return

        if (isSpeaking) {
            window.speechSynthesis.cancel()
            setIsSpeaking(false)
            return
        }

        lineIndexRef.current = currentLineIndex
        setIsSpeaking(true)
        speakCurrentLine()
    }

    const jumpToLine = (offset: number) => {
        window.speechSynthesis.cancel()
        const newIndex = Math.max(0, Math.min(linesForSpeech.length - 1, currentLineIndex + offset))
        lineIndexRef.current = newIndex
        setCurrentLineIndex(newIndex)
        if (isSpeaking) speakCurrentLine()
    }

    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel()
        }
    }, [])

    return (
        <div className="w-full">
            {content ? (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">File Content</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => jumpToLine(-1)}
                                className="px-3 py-1 bg-blue-400 hover:bg-blue-500 text-white rounded"
                            >
                                ◀ Prev Line
                            </button>
                            <button
                                onClick={handleSpeak}
                                className={`px-4 py-2 rounded ${isSpeaking ? 'bg-red-500' : 'bg-green-500'} text-white`}
                            >
                                {isSpeaking ? 'Stop' : 'Read Aloud'}
                            </button>
                            <button
                                onClick={() => jumpToLine(1)}
                                className="px-3 py-1 bg-blue-400 hover:bg-blue-500 text-white rounded"
                            >
                                ▶ Next Line
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                        <label className="text-sm font-medium">Voice Speed:</label>
                        <input
                            type="range"
                            min="0.5"
                            max="4"
                            step="0.1"
                            value={rate}
                            onChange={(e) => setRate(Number(e.target.value))}
                        />
                        <span className="text-sm">{rate.toFixed(1)}x</span>
                    </div>

                    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 max-h-[50vh] overflow-y-auto">
                        <pre className="whitespace-pre-wrap font-mono text-sm">
                            {lines.map((line, lineIdx) => (
                                <div key={lineIdx}>
                                    {line.lineTokens.map((token, tokenIdx) => {
                                        return (
                                            <span
                                                key={tokenIdx}
                                                className={`mr-1 ${lineIdx === currentLineIndex ? 'bg-yellow-300 dark:bg-yellow-600' : token.type === 'keyword' ? 'text-purple-600 dark:text-purple-400 font-bold' : ''}`}
                                            >
                                                {token.text}
                                            </span>
                                        )
                                    })}
                                </div>
                            ))}
                        </pre>
                    </div>
                </>
            ) : (
                <div className="text-center p-8 text-gray-500">
                    No file content to display. Upload a file to see its content here.
                </div>
            )}
        </div>
    )
}
