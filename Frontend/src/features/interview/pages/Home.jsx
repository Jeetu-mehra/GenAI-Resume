import React, { useState, useRef, useEffect } from 'react'
import "../style/home.scss"
import { useInterview } from '../hooks/useInterview.js'
import { useNavigate, useSearchParams, Link } from 'react-router'
import { useAuth } from '../../auth/hooks/useAuth'
import LoadingScreen from '../components/LoadingScreen'


// ── Confirm Delete Modal ───────────────────────────────────────────────────────
const DeleteModal = ({ reportTitle, onConfirm, onCancel }) => (
    <div className='modal-overlay' onClick={onCancel}>
        <div className='modal' onClick={e => e.stopPropagation()}>
            <div className='modal__icon'>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                </svg>
            </div>
            <h3 className='modal__title'>Delete Report?</h3>
            <p className='modal__body'>
                <strong>"{reportTitle}"</strong> will be permanently deleted. This cannot be undone.
            </p>
            <div className='modal__actions'>
                <button className='modal__btn modal__btn--cancel' onClick={onCancel}>Cancel</button>
                <button className='modal__btn modal__btn--delete' onClick={onConfirm}>Delete</button>
            </div>
        </div>
    </div>
)


// ── Trend Chart Component ─────────────────────────────────────────────────────
const TrendChart = ({ trend }) => {
    if (!trend || trend.length === 0) return null

    const width = 500
    const height = 160
    const padding = 30

    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    const minX = 0
    const maxX = trend.length > 1 ? trend.length - 1 : 1
    const minY = 0
    const maxY = 100

    const getX = (index) => padding + (index / maxX) * chartWidth
    const getY = (val) => height - padding - (val / maxY) * chartHeight

    let linePath = ""
    let areaPath = ""
    if (trend.length > 1) {
        linePath = `M ${getX(0)} ${getY(trend[0].matchScore || 0)}`
        trend.forEach((item, index) => {
            if (index > 0) {
                linePath += ` L ${getX(index)} ${getY(item.matchScore || 0)}`
            }
        })
        areaPath = `${linePath} L ${getX(trend.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`
    }

    return (
        <div className="analytics-chart-box">
            <h4 className="analytics-chart-box__title">Match Score Progression</h4>
            <div className="analytics-chart-box__svg-wrap">
                <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#e1034c" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#e1034c" stopOpacity="0.0" />
                        </linearGradient>
                    </defs>
                    
                    {/* Grid lines */}
                    <line x1={padding} y1={getY(0)} x2={width - padding} y2={getY(0)} stroke="#21262d" strokeWidth="1.5" />
                    <line x1={padding} y1={getY(50)} x2={width - padding} y2={getY(50)} stroke="#21262d" strokeWidth="1.5" strokeDasharray="3 3" />
                    <line x1={padding} y1={getY(100)} x2={width - padding} y2={getY(100)} stroke="#21262d" strokeWidth="1.5" />

                    {/* Axis Labels */}
                    <text x={padding - 8} y={getY(0) + 4} textAnchor="end" className="chart-axis-text">0%</text>
                    <text x={padding - 8} y={getY(50) + 4} textAnchor="end" className="chart-axis-text">50%</text>
                    <text x={padding - 8} y={getY(100) + 4} textAnchor="end" className="chart-axis-text">100%</text>

                    {/* Area path */}
                    {trend.length > 1 && (
                        <path d={areaPath} fill="url(#chartGradient)" />
                    )}

                    {/* Line path */}
                    {trend.length > 1 && (
                        <path d={linePath} fill="none" stroke="#e1034c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    )}

                    {/* Dots */}
                    {trend.map((item, index) => {
                        const cx = getX(index)
                        const cy = getY(item.matchScore || 0)
                        return (
                            <g key={index} className="chart-dot-group">
                                <circle cx={cx} cy={cy} r="4.5" fill="#e1034c" stroke="#0d1117" strokeWidth="2" className="chart-dot" />
                                <circle cx={cx} cy={cy} r="10" fill="#e1034c" fillOpacity="0" className="chart-dot-hitbox" />
                                <title>{`${item.title || 'Role'}: ${item.matchScore}%`}</title>
                            </g>
                        )
                    })}
                </svg>
            </div>
        </div>
    )
}

// ── Skill Gaps Chart Component ────────────────────────────────────────────────
const SkillGapsChart = ({ skillGaps }) => {
    if (!skillGaps || skillGaps.length === 0) {
        return (
            <div className="analytics-chart-box">
                <h4 className="analytics-chart-box__title">Recurring Skill Gaps</h4>
                <div className="analytics-chart-box__empty">
                    <p>No recurring skill gaps detected! Great job.</p>
                </div>
            </div>
        )
    }

    const maxCount = Math.max(...skillGaps.map(g => g.count), 1)

    return (
        <div className="analytics-chart-box">
            <h4 className="analytics-chart-box__title">Recurring Skill Gaps</h4>
            <div className="analytics-gaps-list">
                {skillGaps.map((gap, index) => {
                    const barWidth = `${(gap.count / maxCount) * 100}%`
                    return (
                        <div key={index} className="analytics-gap-bar">
                            <div className="analytics-gap-bar__info">
                                <span className="analytics-gap-bar__name">{gap.skill}</span>
                                <span className="analytics-gap-bar__count">{gap.count} {gap.count === 1 ? 'report' : 'reports'}</span>
                            </div>
                            <div className="analytics-gap-bar__track">
                                <div 
                                    className={`analytics-gap-bar__fill analytics-gap-bar__fill--${gap.severity}`} 
                                    style={{ width: barWidth }} 
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ── Strong Matches List Component ─────────────────────────────────────────────
const StrongMatchesList = ({ strongRoles, navigate }) => {
    if (!strongRoles || strongRoles.length === 0) return null

    return (
        <div className="analytics-matches-box">
            <h4 className="analytics-chart-box__title">Strongest Role Matches</h4>
            <div className="analytics-matches-grid">
                {strongRoles.map((role, index) => (
                    <div 
                        key={role._id} 
                        className="analytics-match-card"
                        onClick={() => navigate(`/interview/${role._id}`)}
                    >
                        <div className="analytics-match-card__top">
                            <span className="analytics-match-card__rank">#{index + 1}</span>
                            <span className={`analytics-match-card__score ${role.matchScore >= 80 ? 'score--high' : role.matchScore >= 60 ? 'score--mid' : 'score--low'}`}>
                                {role.matchScore}%
                            </span>
                        </div>
                        <h5 className="analytics-match-card__name">{role.title}</h5>
                        <p className="analytics-match-card__date">Analyzed on {new Date(role.createdAt).toLocaleDateString()}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}


// ── Job Templates ──────────────────────────────────────────────────────────────
const JOB_TEMPLATES = [
    {
        label: "React Engineer (Google)",
        desc: "Senior Frontend Engineer at Google. Experience in React, TypeScript, state management, CSS layouts, and performance optimization. Collaborative team player with experience in CI/CD and unit testing."
    },
    {
        label: "Backend Engineer (Amazon)",
        desc: "Software Development Engineer II (Backend) at Amazon. Expertise in Node.js, Express, MongoDB, RESTful APIs, microservices, AWS services (S3, EC2), and database performance tuning."
    },
    {
        label: "AI Engineer (OpenAI)",
        desc: "Fullstack AI Engineer at OpenAI. Proficient in React, Next.js, Python, FastAPI, Gemini/GPT API integrations, and vector databases. Strong skills in model prompting and structured data parsing."
    }
]


// ── Main Component ─────────────────────────────────────────────────────────────
const Home = () => {
    const { user } = useAuth()
    const [searchParams, setSearchParams] = useSearchParams()
    const activeTab = searchParams.get('tab') || 'dashboard'

    const { loading, generateReport, reports, getReports, deleteReport, fetchJobFromUrl, getAnalytics } = useInterview()
    const [ jobDescription, setJobDescription ] = useState("")
    const [ selfDescription, setSelfDescription ] = useState("")
    const [ error, setError ] = useState("")
    const [ fileName, setFileName ] = useState("")
    const [ resumeFile, setResumeFile ] = useState(null)
    const [ urlInput, setUrlInput ] = useState("")
    const [ urlLoading, setUrlLoading ] = useState(false)
    const [ urlError, setUrlError ] = useState("")
    const [ deleteTarget, setDeleteTarget ] = useState(null)  // { _id, title }
    const [ isGenerating, setIsGenerating ] = useState(false)
    const [ analytics, setAnalytics ] = useState(null)
    const resumeInputRef = useRef()
    const navigate = useNavigate()

    useEffect(() => {
        getReports()
        fetchAnalytics()
    }, [])

    const fetchAnalytics = async () => {
        try {
            const data = await getAnalytics()
            setAnalytics(data)
        } catch (err) {
            console.error("Failed to load analytics:", err)
        }
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setFileName(file.name)
            setResumeFile(file)
            setError("")
        }
    }

    const handleGenerateReport = async () => {
        setError("")
        setIsGenerating(true)
        try {
            const data = await generateReport({ jobDescription, selfDescription, resumeFile })
            navigate(`/interview/${data._id}`)
        } catch (err) {
            setError(err.message || "An error occurred. Please try again.")
        } finally {
            setIsGenerating(false)
        }
    }

    const handleFetchUrl = async () => {
        if (!urlInput.trim()) return
        setUrlError("")
        setUrlLoading(true)
        try {
            const text = await fetchJobFromUrl(urlInput.trim())
            setJobDescription(text)
            setUrlInput("")
        } catch (err) {
            setUrlError(err.message || "Failed to fetch job description from this URL.")
        } finally {
            setUrlLoading(false)
        }
    }

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return
        try {
            await deleteReport(deleteTarget._id)
            fetchAnalytics()
        } catch {
            setError("Failed to delete report. Please try again.")
        } finally {
            setDeleteTarget(null)
        }
    }

    if (isGenerating) return <LoadingScreen mode='generate' />
    if (loading)      return <LoadingScreen mode='load' />

    return (
        <div className='home-page-container'>
            {/* Delete Confirm Modal */}
            {deleteTarget && (
                <DeleteModal
                    reportTitle={deleteTarget.title}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}

            {/* Error Banner */}
            {error && (
                <div className='error-banner'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    <span>{error}</span>
                </div>
            )}

            {/* View State Rendering */}
            {activeTab === 'dashboard' && (
                <div className='portal-view tab-dashboard'>
                    {/* Welcome Banner */}
                    <header className='portal-welcome'>
                        <div className='welcome-text'>
                            <h1>Welcome back, <span className='highlight'>{user?.username || 'Candidate'}</span>!</h1>
                            <p>Track your preparation goals, analyze job matches, and simulate live AI interviews.</p>
                        </div>
                        <div className='welcome-actions'>
                            <button className='welcome-btn welcome-btn--primary' onClick={() => setSearchParams({ tab: 'builder' })}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                Create Prep Plan
                            </button>
                            <button className='welcome-btn welcome-btn--secondary' onClick={() => setSearchParams({ tab: 'mock' })}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                Practice Mock
                            </button>
                        </div>
                    </header>

                    {/* Stats Metrics Cards */}
                    {analytics && reports.length > 0 && (
                        <div className="analytics-stats-grid">
                            <div className="analytics-stat-card">
                                <div className="analytics-stat-card__icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                                </div>
                                <div className="analytics-stat-card__content">
                                    <span className="analytics-stat-card__label">Total Prep Plans</span>
                                    <span className="analytics-stat-card__value">{analytics.totalReports}</span>
                                </div>
                            </div>

                            <div className="analytics-stat-card">
                                <div className="analytics-stat-card__icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="M12 2v10"/></svg>
                                </div>
                                <div className="analytics-stat-card__content">
                                    <span className="analytics-stat-card__label">Avg ATS Match</span>
                                    <span className="analytics-stat-card__value">{analytics.avgMatchScore}%</span>
                                </div>
                            </div>

                            <div className="analytics-stat-card">
                                <div className="analytics-stat-card__icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                </div>
                                <div className="analytics-stat-card__content">
                                    <span className="analytics-stat-card__label">Best ATS Match</span>
                                    <span className="analytics-stat-card__value">{analytics.highestMatchScore}%</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Onboarding View (Empty State) */}
                    {reports.length === 0 ? (
                        <div className='portal-onboarding'>
                            <div className='onboarding-graphics'>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className='graphics-svg'>
                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <path d="M10 13h4" />
                                    <path d="M10 17h4" />
                                    <path d="M10 9h1" />
                                </svg>
                            </div>
                            <h2>Let's create your first preparation plan</h2>
                            <p>Upload your resume and paste a job description. Our AI will analyze skill gaps, generate custom questions, design a daily roadmap, and provide interactive mock coaching.</p>
                            <button className='onboarding-btn' onClick={() => setSearchParams({ tab: 'builder' })}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                Create Prep Strategy Plan
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Charts Visualization Section */}
                            {analytics && (
                                <div className="analytics-charts-row">
                                    <TrendChart trend={analytics.scoreTrend} />
                                    <SkillGapsChart skillGaps={analytics.skillGaps} />
                                </div>
                            )}

                            {/* Recent Strategy plans grid */}
                            <section className='portal-plans-section'>
                                <div className='section-header-row'>
                                    <h2>Your Active Strategy Plans</h2>
                                    <span className='plans-count'>{reports.length} Plans</span>
                                </div>

                                <div className='reports-list'>
                                    {reports.map(report => (
                                        <div key={report._id} className='report-item' onClick={() => navigate(`/interview/${report._id}`)}>
                                            <div className='report-item__top'>
                                                <h3>{report.title || 'Untitled Position'}</h3>
                                                <button
                                                    className='report-item__delete'
                                                    title="Delete report"
                                                    onClick={e => { e.stopPropagation(); setDeleteTarget({ _id: report._id, title: report.title }) }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <p className='report-meta'>Analyzed on {new Date(report.createdAt).toLocaleDateString()}</p>
                                            
                                            <div className='report-item__footer-row'>
                                                <span className={`match-score ${report.matchScore >= 80 ? 'score--high' : report.matchScore >= 60 ? 'score--mid' : 'score--low'}`}>
                                                    {report.matchScore}% Match
                                                </span>
                                                <button 
                                                    className='start-mock-btn' 
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        navigate(`/interview/${report._id}/mock`)
                                                    }}
                                                >
                                                    Practice
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </>
                    )}
                </div>
            )}

            {activeTab === 'builder' && (
                <div className='portal-view tab-builder'>
                    <header className='portal-section-header'>
                        <h1>Generate New Interview Prep Plan</h1>
                        <p>Analyze any target role requirements against your resume file or self-description.</p>
                    </header>

                    {/* Main Creation Card Form */}
                    <div className='interview-card'>
                        <div className='interview-card__body'>

                            {/* Left Panel - Job Description */}
                            <div className='panel panel--left'>
                                <div className='panel__header'>
                                    <span className='panel__icon'>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                                    </span>
                                    <h2>Target Job Description</h2>
                                    <span className='badge badge--required'>Required</span>
                                </div>

                                {/* URL Import Row */}
                                <div className='url-import'>
                                    <div className='url-import__row'>
                                        <div className='url-import__input-wrap'>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                            <input
                                                type='url'
                                                className='url-import__input'
                                                placeholder='Paste LinkedIn, Indeed, or any job URL...'
                                                value={urlInput}
                                                onChange={e => setUrlInput(e.target.value)}
                                                onKeyDown={e => e.key === "Enter" && handleFetchUrl()}
                                            />
                                        </div>
                                        <button
                                            className={`url-import__btn ${urlLoading ? 'url-import__btn--loading' : ''}`}
                                            onClick={handleFetchUrl}
                                            disabled={urlLoading || !urlInput.trim()}
                                        >
                                            {urlLoading ? (
                                                <span className='url-import__spinner' />
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /></svg>
                                            )}
                                            {urlLoading ? "Fetching..." : "Fetch"}
                                        </button>
                                    </div>
                                    {urlError && <p className='url-import__error'>{urlError}</p>}
                                    {!urlError && <p className='url-import__hint'>Auto-imports job description from any job board</p>}
                                </div>

                                {/* Quick Templates Selector */}
                                <div className='template-quick-select'>
                                    <span className='template-label'>Quick Templates:</span>
                                    <div className='template-pills'>
                                        {JOB_TEMPLATES.map((tmpl, idx) => (
                                            <button 
                                                key={idx}
                                                type='button'
                                                className='template-pill-btn'
                                                onClick={() => setJobDescription(tmpl.desc)}
                                            >
                                                {tmpl.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <textarea
                                    onChange={(e) => { setJobDescription(e.target.value) }}
                                    value={jobDescription}
                                    className='panel__textarea'
                                    placeholder={`Or paste the full job description here...\ne.g. 'Senior Frontend Engineer at Google requires proficiency in React, TypeScript, and large-scale system design...'`}
                                    maxLength={5000}
                                />
                                <div className='char-counter'>{jobDescription.length} / 5000 chars</div>
                            </div>

                            {/* Vertical Divider */}
                            <div className='panel-divider' />

                            {/* Right Panel - Profile */}
                            <div className='panel panel--right'>
                                <div className='panel__header'>
                                    <span className='panel__icon'>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                    </span>
                                    <h2>Your Profile</h2>
                                </div>

                                {/* Upload Resume */}
                                <div className='upload-section'>
                                    <label className='section-label'>
                                        Upload Resume
                                        <span className='badge badge--best'>Best Results</span>
                                    </label>
                                    
                                    {fileName ? (
                                        <div className='uploaded-file-card'>
                                            <div className='uploaded-file-card__icon'>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                                    <polyline points="14 2 14 8 20 8" />
                                                </svg>
                                            </div>
                                            <div className='uploaded-file-card__details'>
                                                <p className='file-name'>{fileName}</p>
                                                <p className='file-size'>Ready for analysis</p>
                                            </div>
                                            <button 
                                                type='button'
                                                className='uploaded-file-card__remove-btn' 
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    setFileName("")
                                                    setResumeFile(null)
                                                    if (resumeInputRef.current) resumeInputRef.current.value = ""
                                                }}
                                                title="Remove file"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <label className='dropzone' htmlFor='resume'>
                                            <span className='dropzone__icon'>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>
                                            </span>
                                            <p className='dropzone__title'>Click to upload or drag & drop</p>
                                            <p className='dropzone__subtitle'>PDF or DOCX (Max 5MB)</p>
                                            <input ref={resumeInputRef} onChange={handleFileChange} hidden type='file' id='resume' name='resume' accept='.pdf,.docx' />
                                        </label>
                                    )}
                                </div>

                                {/* OR Divider */}
                                <div className='or-divider'><span>OR</span></div>

                                {/* Quick Self-Description */}
                                <div className='self-description'>
                                    <label className='section-label' htmlFor='selfDescription'>Quick Self-Description</label>
                                    <textarea
                                        onChange={(e) => { setSelfDescription(e.target.value) }}
                                        id='selfDescription'
                                        name='selfDescription'
                                        value={selfDescription}
                                        className='panel__textarea panel__textarea--short'
                                        placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
                                    />
                                </div>

                                {/* Info Box */}
                                <div className='info-box'>
                                    <span className='info-box__icon'>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" stroke="#1a1f27" strokeWidth="2" /><line x1="12" y1="16" x2="12.01" y2="16" stroke="#1a1f27" strokeWidth="2" /></svg>
                                    </span>
                                    <p>Either a <strong>Resume</strong> or a <strong>Self Description</strong> is required to generate a personalized plan.</p>
                                </div>
                            </div>
                        </div>

                        {/* Card Footer */}
                        <div className='interview-card__footer'>
                            <span className='footer-info'>AI-Powered Strategy Generation &bull; Approx 30s</span>
                            <button
                                onClick={handleGenerateReport}
                                disabled={loading}
                                className='generate-btn'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></svg>
                                {loading ? 'Generating...' : 'Generate My Interview Strategy'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'mock' && (
                <div className='portal-view tab-mock-index'>
                    <header className='portal-section-header'>
                        <h1>AI Mock Interview Practice Center</h1>
                        <p>Practice live interviews tailored directly to your target roles. Select a strategy plan below to launch the simulator.</p>
                    </header>

                    {reports.length === 0 ? (
                        <div className='portal-onboarding'>
                            <div className='onboarding-graphics'>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className='graphics-svg'>
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                </svg>
                            </div>
                            <h2>No roles available for practice</h2>
                            <p>Create an interview strategy plan first to enable conversational mock interviews tailored to that role's specifications.</p>
                            <button className='onboarding-btn' onClick={() => setSearchParams({ tab: 'builder' })}>
                                Create Prep Plan First
                            </button>
                        </div>
                    ) : (
                        <div className='mock-positions-grid'>
                            {reports.map(report => (
                                <div key={report._id} className='mock-position-card'>
                                    <div className='card-main-info'>
                                        <h3>{report.title}</h3>
                                        <p className='card-meta-date'>Strategy analyzed on {new Date(report.createdAt).toLocaleDateString()}</p>
                                        <span className={`match-badge ${report.matchScore >= 80 ? 'match-badge--high' : report.matchScore >= 60 ? 'match-badge--mid' : 'match-badge--low'}`}>
                                            ATS Score: {report.matchScore}%
                                        </span>
                                    </div>
                                    <div className='card-actions-area'>
                                        <button 
                                            className='btn-launch-mock' 
                                            onClick={() => navigate(`/interview/${report._id}/mock`)}
                                        >
                                            Start Mock Interview
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default Home