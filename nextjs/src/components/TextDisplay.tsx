'use client'

import {useEffect, useRef, useState} from 'react'
import {fetchModel, Line, TextModel} from '@/lib/readingModel'

interface TextDisplayProps {
    content: string
    mode: string
    language: string
}

export default function TextDisplay({content, language, mode}: TextDisplayProps) {
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [currentLineIndex, setCurrentLineIndex] = useState<number>(0)
    const [currentTokenInLineIndex, setCurrentTokenInLineIndex] = useState<number>(-1)
    const [rate, setRate] = useState<number>(1)

    let model: TextModel = fetchModel(language, mode)
    const lines: Line[] = model.tokenize(content, mode)


    let currentCharIndex = 0
    const linesForSpeech: string[] = []

    lines.forEach((line) => {
        let lineForSpeech = ''
        line.lineTokens.forEach((token) => {
            token.speechCharStart = currentCharIndex
            if(token.spoken) {
                if(token.replacement)
                {
                    lineForSpeech += ' ' + token.replacement  + ' ';
                }else {
                    if (token.text.length === 1) {
                        lineForSpeech += token.text
                        currentCharIndex += 1
                    } else {
                        lineForSpeech += ' ' + token.text + ' '
                        currentCharIndex += token.text.length + 2
                    }
                }
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
                // Move to next line

                setCurrentTokenInLineIndex(-1);
                console.log(`About to speak current line ${currentLineIndex}`);
                speakCurrentLine()
           // }
        }

        utterance.onboundary = (event) =>{
            if (event.name === 'word') {
                // For the current line find the next index to be spoken.
                setCurrentTokenInLineIndex(prev => {

                    return model.nextSpokenToken(currentLineIndex, prev);
                });
            }
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

    const resetToStart = () =>{
        setIsSpeaking(false);
        setCurrentLineIndex(0);
        setCurrentTokenInLineIndex(-1)
        window.speechSynthesis.cancel();
    }

    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel()
        }
    }, [])

    // New file has been added, reset to start again
    useEffect(() => {
       setCurrentLineIndex(0)
    }, [content]);

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
                            <button
                                onClick={() => resetToStart()}
                                className="px-3 py-1 bg-amber-800 hover:bg-blue-500 text-white rounded"

                            >
                                Reset
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
                                        let styleClasses = [];
                                        if(token.whiteSpace)
                                            styleClasses.push('mr-1');
                                        if(lineIdx === currentLineIndex)
                                        {
                                            //styleClasses.push('bg-yellow-300 dark:bg-yellow-600')
                                            if(tokenIdx === currentTokenInLineIndex)
                                            {
                                                console.log(`tokeIdx ${tokenIdx} === ${currentTokenInLineIndex} text ${token.text}`)
                                                styleClasses.push('bg-red-300');
                                            }
                                        }


                                        return (
                                            <span
                                                key={tokenIdx}
                                                className={styleClasses.join(' ')}
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
