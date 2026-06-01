import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { useInterview } from '../hooks/useInterview'
import LoadingScreen from '../components/LoadingScreen'
import '../style/mockInterview.scss'

const PRESET_QUESTIONS = [
    "Excellent! Let's dive into a technical scenario. Since this role requires solid architecture skills, how would you handle state management or optimize performance in a large-scale application?",
    "Understood. Let's shift to a behavioral question. Can you tell me about a time you faced a tight deadline or high pressure, and how you managed to deliver?",
    "Great response. One last question: If you were hired tomorrow, what is the first thing you would do to ensure you integrate smoothly into the team?",
    "Thank you for sharing that. That concludes the structured questions for today. I have generated your performance report. Please click 'End & Grade Interview' to see your details!"
]

const MockInterviewSession = () => {
    const { interviewId } = useParams()
    const navigate = useNavigate()
    const { report, getReportById, loading } = useInterview()
    const [messages, setMessages] = useState([])
    const [inputValue, setInputValue] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [currentStep, setCurrentStep] = useState(0) // 0: intro, 1: tech, 2: behavioral, 3: wrapup, 4: done
    const [showFeedback, setShowFeedback] = useState(false)
    const chatEndRef = useRef(null)

    // Load report details
    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        }
    }, [interviewId])

    // Load initial greeting
    useEffect(() => {
        if (report) {
            setMessages([
                {
                    id: 1,
                    role: 'assistant',
                    content: `Hello! I will be your interviewer today for the ${report.title || 'Target'} role. I have analyzed your profile and identified some key areas to assess. Let's start with a standard opening question: Can you describe your background and tell me why you are interested in this position?`,
                    timestamp: new Date()
                }
            ])
        }
    }, [report])

    // Scroll to bottom on new messages
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isTyping])

    const handleSend = () => {
        if (!inputValue.trim()) return

        const userMessage = {
            id: messages.length + 1,
            role: 'user',
            content: inputValue.trim(),
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInputValue('')
        setIsTyping(true)

        // Simulate AI thinking and response
        setTimeout(() => {
            setIsTyping(false)
            let replyContent = ""
            
            if (currentStep < PRESET_QUESTIONS.length) {
                replyContent = PRESET_QUESTIONS[currentStep]
                setCurrentStep(prev => prev + 1)
            } else {
                replyContent = "The interview has ended. Please click 'End & Grade' at the top to generate your feedback scorecard!"
            }

            const aiMessage = {
                id: messages.length + 2,
                role: 'assistant',
                content: replyContent,
                timestamp: new Date()
            }
            setMessages(prev => [...prev, aiMessage])
        }, 1500)
    }

    if (loading || !report) return <LoadingScreen mode='load' />

    return (
        <div className='mock-interview-page'>
            {/* Feedback Report Overlay */}
            {showFeedback && (
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
                                <div className='score-ring score-ring--high'>
                                    <span className='score-ring__value'>78</span>
                                    <span className='score-ring__max'>/100</span>
                                </div>
                                <div className='score-assessment'>
                                    <h3>Overall Rating: Strong Match</h3>
                                    <p>You demonstrated clear understanding of technical architectures and answered the behavioral scenarios with good structure. Communication was steady, though some explanations could be more concise.</p>
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
                                        <li>Clear explanation of system scaling considerations and bottleneck analysis.</li>
                                        <li>Good logical flow using professional terminology matching the job description.</li>
                                        <li>Strong demonstration of teamwork and problem ownership in behavioral responses.</li>
                                    </ul>
                                </div>

                                <div className='feedback-col feedback-col--improvements'>
                                    <h4>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                        Areas for Improvement
                                    </h4>
                                    <ul>
                                        <li>Provide more specific details on technology stacks instead of high-level abstractions.</li>
                                        <li>Use the STAR methodology (Situation, Task, Action, Result) more rigidly for behavioral answers to showcase final outcomes.</li>
                                        <li>Ensure direct answers to questions are stated upfront before providing background details.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className='feedback-card__footer'>
                            <button className='btn btn--restart' onClick={() => {
                                setMessages([
                                    {
                                        id: 1,
                                        role: 'assistant',
                                        content: `Hello! I will be your interviewer today for the ${report.title || 'Target'} role. Let's restart. Can you describe your background and tell me why you are interested in this position?`,
                                        timestamp: new Date()
                                    }
                                ])
                                setCurrentStep(0)
                                setShowFeedback(false)
                            }}>
                                Restart Session
                            </button>
                            <Link to='/?tab=dashboard' className='btn btn--home'>
                                Back to Dashboard
                            </Link>
                        </div>
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
                    <span className='status-badge'>
                        <span className='pulse-dot' />
                        Live Simulator
                    </span>
                    <button className='end-session-btn' onClick={() => setShowFeedback(true)}>
                        End & Grade Interview
                    </button>
                </div>
            </header>

            {/* Session Content layout */}
            <div className='session-layout'>
                {/* Left Column - Chat Room */}
                <div className='chat-console'>
                    <div className='chat-messages-container'>
                        {messages.map(msg => (
                            <div key={msg.id} className={`message-row message-row--${msg.role}`}>
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
                                <div className='message-bubble'>
                                    <p className='message-text'>{msg.content}</p>
                                    <span className='message-time'>
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                        <textarea
                            className='chat-textarea'
                            placeholder='Type your response here...'
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSend()
                                }
                            }}
                        />
                        <button className='chat-send-btn' onClick={handleSend} disabled={!inputValue.trim() || isTyping}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        </button>
                    </div>
                </div>

                {/* Right Column - Status Panel */}
                <aside className='chat-sidebar'>
                    <div className='sidebar-box'>
                        <h3>Interview Progress</h3>
                        <div className='progress-stepper'>
                            <div className={`step-item ${currentStep >= 0 ? 'step-item--completed' : ''}`}>
                                <span className='step-circle'>✓</span>
                                <span className='step-name'>Welcome & Setup</span>
                            </div>
                            <div className={`step-item ${currentStep > 0 ? 'step-item--completed' : currentStep === 0 ? 'step-item--active' : ''}`}>
                                <span className='step-circle'>{currentStep > 0 ? '✓' : '1'}</span>
                                <span className='step-name'>Self Introduction</span>
                            </div>
                            <div className={`step-item ${currentStep > 1 ? 'step-item--completed' : currentStep === 1 ? 'step-item--active' : ''}`}>
                                <span className='step-circle'>{currentStep > 1 ? '✓' : '2'}</span>
                                <span className='step-name'>Technical Skills</span>
                            </div>
                            <div className={`step-item ${currentStep > 2 ? 'step-item--completed' : currentStep === 2 ? 'step-item--active' : ''}`}>
                                <span className='step-circle'>{currentStep > 2 ? '✓' : '3'}</span>
                                <span className='step-name'>Behavioral Scenarios</span>
                            </div>
                            <div className={`step-item ${currentStep > 3 ? 'step-item--completed' : currentStep === 3 ? 'step-item--active' : ''}`}>
                                <span className='step-circle'>{currentStep > 3 ? '✓' : '4'}</span>
                                <span className='step-name'>Closing Remarks</span>
                            </div>
                        </div>
                    </div>

                    <div className='sidebar-box'>
                        <h3>Quick Preparation Tips</h3>
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
