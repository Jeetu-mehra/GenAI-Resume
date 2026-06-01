import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { useInterview } from '../hooks/useInterview'
import { useMockInterview } from '../hooks/useMockInterview'
import LoadingScreen from '../components/LoadingScreen'
import '../style/mockInterview.scss'

const MockInterviewSession = () => {
    const { interviewId } = useParams()
    const navigate = useNavigate()
    const { report, getReportById, loading: reportLoading } = useInterview()
    const { 
        loading: mockLoading, 
        session, 
        messages, 
        startSession, 
        sendMessageText, 
        endSessionGracefully 
    } = useMockInterview()
    
    const [inputValue, setInputValue] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [showFeedback, setShowFeedback] = useState(false)
    const chatEndRef = useRef(null)

    // Voice Mode State
    const [voiceModeEnabled, setVoiceModeEnabled] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [speechSupported, setSpeechSupported] = useState(false)
    const [showVoiceModal, setShowVoiceModal] = useState(false) // Overlay room modal
    const [isAiSpeaking, setIsAiSpeaking] = useState(false) // TTS speaking indicator
    const recognitionRef = useRef(null)
    const baseTextRef = useRef('')
    const lastReadIndexRef = useRef(-1)

    // Text-To-Speech (TTS) Voice Engine
    const speakText = (text) => {
        if (!window.speechSynthesis) return

        // Cancel any active speech synthesis
        window.speechSynthesis.cancel()

        // Clean text formatting (remove markdown asterisks, bold markers, backticks, hashes)
        const cleanedText = text.replace(/[*_`#]/g, '').trim()

        const utterance = new SpeechSynthesisUtterance(cleanedText)
        utterance.lang = 'en-US'

        const voices = window.speechSynthesis.getVoices()
        // Prioritize natural US/GB English voices
        const selectedVoice = voices.find(voice => 
            voice.lang.startsWith('en-US') && 
            (voice.name.includes('Google') || voice.name.includes('Natural') || voice.name.includes('David'))
        ) || voices.find(voice => voice.lang.startsWith('en'))

        if (selectedVoice) {
            utterance.voice = selectedVoice
        }

        utterance.rate = 1.05 // Recruiter pacing
        utterance.pitch = 1.0

        utterance.onstart = () => {
            setIsAiSpeaking(true)
        }

        utterance.onend = () => {
            setIsAiSpeaking(false)
            // Hands-free trigger: if voice modal is open, immediately activate mic for candidate response!
            if (voiceModeEnabled || showVoiceModal) {
                // Short timeout to prevent mic hearing the tail end of the audio output (highly robust)
                setTimeout(() => {
                    startListening()
                }, 100)
            }
        }

        utterance.onerror = (e) => {
            console.error("Speech synthesis error:", e)
            setIsAiSpeaking(false)
        }

        window.speechSynthesis.speak(utterance)
    }

    const handleMuteSpeech = () => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel()
        }
        setIsAiSpeaking(false)
    }

    // Speech-To-Text (STT) Speech Recognition
    useEffect(() => {
        // Asynchronously initialize speech voices
        if (window.speechSynthesis) {
            window.speechSynthesis.getVoices()
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (SpeechRecognition) {
            setSpeechSupported(true)
            const recognition = new SpeechRecognition()
            recognition.continuous = true
            recognition.interimResults = true
            recognition.lang = 'en-US'

            recognition.onstart = () => {
                setIsListening(true)
            }

            recognition.onresult = (event) => {
                let transcript = ''
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript
                }
                
                setInputValue(() => {
                    const base = baseTextRef.current
                    return base + (base && !base.endsWith(' ') ? ' ' : '') + transcript
                })
            }

            recognition.onerror = (event) => {
                console.error("Speech recognition error:", event.error)
                setIsListening(false)
            }

            recognition.onend = () => {
                setIsListening(false)
            }

            recognitionRef.current = recognition
        }

        return () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel()
            }
            if (recognitionRef.current) {
                recognitionRef.current.abort()
            }
        }
    }, [])

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            baseTextRef.current = inputValue
            try {
                // Cancel speaking if we are talking to the mic
                handleMuteSpeech()
                recognitionRef.current.start()
            } catch (err) {
                console.error("Failed to start speech recognition:", err)
            }
        }
    }

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            try {
                recognitionRef.current.stop()
            } catch (err) {
                console.error("Failed to stop speech recognition:", err)
            }
        }
    }

    // Load report details on mount
    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
            startSession(interviewId).then(() => {
                lastReadIndexRef.current = -1
            }).catch(err => {
                console.error("Failed to start session:", err)
            })
        }
    }, [interviewId])

    // Scroll to bottom on new messages
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isTyping])

    // Automatically read new assistant messages if Voice Mode is active
    useEffect(() => {
        if (voiceModeEnabled && messages.length > 0) {
            const lastIndex = messages.length - 1
            const lastMsg = messages[lastIndex]
            if (lastMsg.role === 'assistant' && lastReadIndexRef.current < lastIndex) {
                lastReadIndexRef.current = lastIndex
                speakText(lastMsg.content)
            }
        }
    }, [messages, voiceModeEnabled, showVoiceModal])

    const handleExitVoiceModal = () => {
        setShowVoiceModal(false)
        setVoiceModeEnabled(false)
        handleMuteSpeech()
        stopListening()
    }

    const handleEnterVoiceModal = () => {
        setShowVoiceModal(true)
        setVoiceModeEnabled(true)
        // Speak the last assistant message if any exists
        const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant')
        if (lastAssistantMsg) {
            speakText(lastAssistantMsg.content)
        }
    }

    const handleSend = async () => {
        // Stop speech recognition when sending
        stopListening()
        
        if (!inputValue.trim() || !session) return

        const text = inputValue.trim()
        setInputValue('')
        setIsTyping(true)

        // Cancel running speech synthesis when candidate replies
        handleMuteSpeech()

        try {
            await sendMessageText(session._id, text)
        } catch (err) {
            console.error("Failed to process reply:", err)
        } finally {
            setIsTyping(false)
        }
    }

    const handleEndInterview = async () => {
        stopListening()
        handleMuteSpeech()
        if (!session) return
        try {
            await endSessionGracefully(session._id)
            setShowFeedback(true)
        } catch (err) {
            console.error("Failed to grade session:", err)
        }
    }

    const handleRestartSession = async () => {
        stopListening()
        handleMuteSpeech()
        if (!interviewId) return
        setShowFeedback(false)
        setInputValue('')
        lastReadIndexRef.current = -1
        try {
            if (session && session.status !== "completed") {
                await endSessionGracefully(session._id)
            }
            await startSession(interviewId)
        } catch (err) {
            console.error("Failed to restart session:", err)
        }
    }

    if (reportLoading || !report) return <LoadingScreen mode='load' />
    if (mockLoading && !session) return <LoadingScreen mode='load' />

    // Stepper logic based on conversation user message length
    const userMessagesCount = messages.filter(m => m.role === 'user').length
    const activeStepIndex = Math.min(userMessagesCount, 3) // 0: intro, 1: tech, 2: behavioral, 3: wrapup

    return (
        <div className='mock-interview-page'>
            {/* Feedback Report Overlay */}
            {showFeedback && session && session.feedback && (
                <div className='feedback-overlay'>
                    <div className='feedback-card'>
                        <div className='feedback-card__header'>
                            <div className='feedback-card__badge-icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            </div>
                            <h2>Interview Performance Scorecard</h2>
                            <p>Tailored feedback generated on your simulated responses for <strong>{report.title}</strong>.</p>
                        </div>

                        <div className='feedback-card__body'>
                            {/* Score Ring */}
                            <div className='feedback-score-section'>
                                <div className={`score-ring ${session.feedback.score >= 80 ? 'score-ring--high' : 'score-ring--mid'}`}>
                                    <span className='score-ring__value'>{session.feedback.score}</span>
                                    <span className='score-ring__max'>/100</span>
                                </div>
                                <div className='score-assessment'>
                                    <h3>Overall Rating: {session.feedback.score >= 80 ? 'Strong Match' : session.feedback.score >= 60 ? 'Good Potential' : 'Needs Preparation'}</h3>
                                    <p>{session.feedback.summary}</p>
                                </div>
                            </div>

                            {/* Strengths & Improvements */}
                            <div className='feedback-columns'>
                                <div className='feedback-col feedback-col--strengths'>
                                    <h4>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                        Key Strengths
                                    </h4>
                                    <ul>
                                        {session.feedback.strengths.map((str, i) => (
                                            <li key={i}>{str}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div className='feedback-col feedback-col--improvements'>
                                    <h4>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                        Areas for Improvement
                                    </h4>
                                    <ul>
                                        {session.feedback.improvements.map((imp, i) => (
                                            <li key={i}>{imp}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className='feedback-card__footer'>
                            <button className='btn btn--restart' onClick={handleRestartSession}>
                                Restart Session
                            </button>
                            <Link to='/?tab=dashboard' className='btn btn--home'>
                                Back to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Immersive Voice Room Modal Overlay */}
            {showVoiceModal && (
                <div className='voice-room-overlay'>
                    <div className='voice-room-card'>
                        {/* Header */}
                        <header className='voice-room-header'>
                            <div className='voice-room-header__left'>
                                <span className='live-badge'>
                                    <span className='pulse-dot' />
                                    Live Session
                                </span>
                                <h3>{report.title}</h3>
                            </div>
                            <button className='voice-room-close-btn' onClick={handleExitVoiceModal} title="Exit Voice Room">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </header>

                        {/* Body content */}
                        <div className='voice-room-body'>
                            {/* Animated sound wave orb */}
                            <div className='voice-orb-container'>
                                <div className={`voice-orb ${isAiSpeaking ? 'voice-orb--speaking' : isListening ? 'voice-orb--listening' : ''}`}>
                                    <div className='voice-orb__pulse-ring-1' />
                                    <div className='voice-orb__pulse-ring-2' />
                                    <div className='voice-orb__core'>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="11" width="18" height="10" rx="2" />
                                            <circle cx="12" cy="5" r="2" />
                                            <path d="M12 7v4" />
                                        </svg>
                                    </div>
                                </div>
                                <p className='voice-status-text'>
                                    {isAiSpeaking ? "Interviewer is speaking..." : isListening ? "Listening... Speak now" : "Tap Microphone to respond"}
                                </p>
                            </div>

                            {/* Question box display */}
                            <div className='voice-question-box'>
                                <h4>Current Question</h4>
                                <p className='question-text'>
                                    {[...messages].reverse().find(m => m.role === 'assistant')?.content || "Initializing interview strategy simulation..."}
                                </p>
                            </div>

                            {/* Candidate live transcription card */}
                            <div className='voice-transcript-box'>
                                <h4>Your Response (Live Transcript)</h4>
                                <div className={`transcript-content ${isListening ? 'transcript-content--active' : ''}`}>
                                    {inputValue ? (
                                        <p className='transcript-text'>{inputValue}</p>
                                    ) : (
                                        <p className='transcript-placeholder'>
                                            {isListening ? "Hearing your response... Please speak." : "No transcript recorded. Click the mic button below to start dictating."}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer controls */}
                        <footer className='voice-room-footer'>
                            <button
                                className={`voice-ctrl-btn voice-ctrl-btn--mic ${isListening ? 'voice-ctrl-btn--active' : ''}`}
                                onClick={isListening ? stopListening : startListening}
                                title={isListening ? "Stop Microphone" : "Start Microphone"}
                                type="button"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                    <line x1="12" y1="19" x2="12" y2="23"/>
                                </svg>
                                {isListening && (
                                    <div className="voice-waves voice-waves--modal">
                                        <span className="wave-bar"></span>
                                        <span className="wave-bar"></span>
                                        <span className="wave-bar"></span>
                                    </div>
                                )}
                            </button>

                            <button 
                                className='voice-send-btn'
                                onClick={handleSend}
                                disabled={!inputValue.trim() || isTyping}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                                Send Response
                            </button>

                            <button
                                className='voice-exit-btn'
                                onClick={handleExitVoiceModal}
                            >
                                Switch to Text Mode
                            </button>
                        </footer>
                    </div>
                </div>
            )}

            {/* Session Top Bar */}
            <header className='session-header'>
                <div className='session-header__left'>
                    <Link to={`/interview/${interviewId}`} className='back-link'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                        Back to Strategy
                    </Link>
                    <div className='session-title-wrap'>
                        <h1>AI Mock Interview Session</h1>
                        <span className='role-badge'>{report.title}</span>
                    </div>
                </div>
                <div className='session-header__right'>
                    {speechSupported && (
                        <button 
                            className="voice-mode-toggle"
                            onClick={handleEnterVoiceModal}
                            title="Enter Interactive Voice Room"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                <line x1="12" y1="19" x2="12" y2="23"/>
                            </svg>
                            <span>Voice Room</span>
                        </button>
                    )}
                    <span className='status-badge'>
                        <span className='pulse-dot' />
                        Live Simulator
                    </span>
                    <button className='end-session-btn' onClick={handleEndInterview} disabled={messages.length <= 1 || mockLoading}>
                        End & Grade Interview
                    </button>
                </div>
            </header>

            {/* Session Content layout */}
            <div className='session-layout'>
                {/* Left Column - Chat Room */}
                <div className='chat-console'>
                    <div className='chat-messages-container'>
                        {messages.map((msg, index) => (
                            <div key={index} className={`message-row message-row--${msg.role}`}>
                                {msg.role === 'assistant' && (
                                    <div className='message-avatar'>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="11" width="18" height="10" rx="2" />
                                            <circle cx="12" cy="5" r="2" />
                                            <path d="M12 7v4" />
                                            <line x1="8" y1="16" x2="8" y2="16" />
                                            <line x1="16" y1="16" x2="16" y2="16" />
                                        </svg>
                                    </div>
                                )}
                                <div className={`message-bubble ${msg.role === 'assistant' ? 'message-bubble--assistant' : ''}`}>
                                    {msg.role === 'assistant' && (
                                        <button 
                                            className="bubble-speak-btn" 
                                            onClick={() => speakText(msg.content)}
                                            title="Read out loud"
                                            type="button"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                                            </svg>
                                        </button>
                                    )}
                                    <p className='message-text'>{msg.content}</p>
                                    <span className='message-time'>
                                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className='message-row message-row--assistant'>
                                <div className='message-avatar'>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="10" rx="2" />
                                        <circle cx="12" cy="5" r="2" />
                                        <path d="M12 7v4" />
                                    </svg>
                                </div>
                                <div className='message-bubble message-bubble--typing'>
                                    <span className='dot-loader'></span>
                                    <span className='dot-loader'></span>
                                    <span className='dot-loader'></span>
                                </div>
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>

                    <div className='chat-input-bar'>
                        {speechSupported && (
                            <button
                                className={`mic-btn ${isListening ? 'mic-btn--listening' : ''}`}
                                onClick={isListening ? stopListening : startListening}
                                disabled={session?.status === 'completed' || isTyping}
                                title={isListening ? "Stop Listening" : "Start Voice Input"}
                                type="button"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                    <line x1="12" y1="19" x2="12" y2="23"/>
                                </svg>
                                {isListening && <span className="mic-glow-ring" />}
                            </button>
                        )}

                        {isListening && (
                            <div className="voice-waves">
                                <span className="wave-bar"></span>
                                <span className="wave-bar"></span>
                                <span className="wave-bar"></span>
                                <span className="wave-bar"></span>
                            </div>
                        )}

                        <textarea
                            className={`chat-textarea ${isListening ? 'chat-textarea--listening' : ''}`}
                            placeholder={isListening ? 'Listening... Speak now' : 'Type your response here...'}
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSend()
                                }
                            }}
                            disabled={session?.status === 'completed' || isTyping}
                        />
                        <button 
                            className='chat-send-btn' 
                            onClick={handleSend} 
                            disabled={!inputValue.trim() || isTyping || session?.status === 'completed'}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        </button>
                    </div>
                </div>

                {/* Right Column - Status Panel */}
                <aside className='chat-sidebar'>
                    <div className='sidebar-box'>
                        <h3>Interview Progress</h3>
                        <div className='progress-stepper'>
                            <div className={`step-item ${activeStepIndex >= 0 ? 'step-item--completed' : ''}`}>
                                <span className='step-circle'>✓</span>
                                <span className='step-name'>Welcome & Setup</span>
                            </div>
                            <div className={`step-item ${activeStepIndex > 0 ? 'step-item--completed' : activeStepIndex === 0 ? 'step-item--active' : ''}`}>
                                <span className='step-circle'>{activeStepIndex > 0 ? '✓' : '1'}</span>
                                <span className='step-name'>Self Introduction</span>
                            </div>
                            <div className={`step-item ${activeStepIndex > 1 ? 'step-item--completed' : activeStepIndex === 1 ? 'step-item--active' : ''}`}>
                                <span className='step-circle'>{activeStepIndex > 1 ? '✓' : '2'}</span>
                                <span className='step-name'>Technical Skills</span>
                            </div>
                            <div className={`step-item ${activeStepIndex > 2 ? 'step-item--completed' : activeStepIndex === 2 ? 'step-item--active' : ''}`}>
                                <span className='step-circle'>{activeStepIndex > 2 ? '✓' : '3'}</span>
                                <span className='step-name'>Behavioral Fit</span>
                            </div>
                        </div>
                    </div>

                    <div className='sidebar-box'>
                        <h3>Quick Practice Tips</h3>
                        <ul className='tips-list'>
                            <li>
                                <strong>STAR Framework:</strong> Structure behavioral responses detailing Situation, Task, Action, and Result.
                            </li>
                            <li>
                                <strong>Keep Answers Concise:</strong> Avoid dragging details. Stay focused on the question core.
                            </li>
                            <li>
                                <strong>Be Honest:</strong> If you don't know something, discuss how you would find out the solution logically.
                            </li>
                        </ul>
                    </div>
                </aside>
            </div>
        </div>
    )
}

export default MockInterviewSession
