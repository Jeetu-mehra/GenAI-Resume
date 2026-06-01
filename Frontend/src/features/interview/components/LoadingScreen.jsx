import React, { useState, useEffect } from 'react'
import './LoadingScreen.scss'

// Steps shown while generating a NEW report (Home page flow)
const GENERATE_STEPS = [
    { icon: '📄', label: 'Parsing your resume', duration: 4000 },
    { icon: '🔍', label: 'Analysing job requirements', duration: 5000 },
    { icon: '🧠', label: 'Mapping skill gaps', duration: 6000 },
    { icon: '❓', label: 'Generating interview questions', duration: 7000 },
    { icon: '🗺️', label: 'Building preparation roadmap', duration: 5000 },
    { icon: '✨', label: 'Finalising your strategy', duration: 99999 },
]

// Steps shown while loading an existing report (Interview page)
const LOAD_STEPS = [
    { icon: '🔗', label: 'Connecting to database', duration: 800 },
    { icon: '📊', label: 'Fetching your report', duration: 1200 },
    { icon: '🎨', label: 'Rendering your plan', duration: 99999 },
]

// Steps shown while generating a cover letter
const COVER_LETTER_STEPS = [
    { icon: '📄', label: 'Reading your profile', duration: 3000 },
    { icon: '✍️', label: 'Crafting your cover letter', duration: 6000 },
    { icon: '🎨', label: 'Formatting the document', duration: 4000 },
    { icon: '📥', label: 'Preparing your download', duration: 99999 },
]

const STEP_SETS = {
    generate: GENERATE_STEPS,
    load: LOAD_STEPS,
    'cover-letter': COVER_LETTER_STEPS,
}

/**
 * @param {'generate' | 'load' | 'cover-letter'} mode
 */
const LoadingScreen = ({ mode = 'load' }) => {
    const steps = STEP_SETS[mode] || LOAD_STEPS
    const [activeStep, setActiveStep] = useState(0)

    useEffect(() => {
        setActiveStep(0)
        let current = 0

        const tick = () => {
            if (current < steps.length - 1) {
                current += 1
                setActiveStep(current)
                timer = setTimeout(tick, steps[current].duration)
            }
        }

        let timer = setTimeout(tick, steps[0].duration)
        return () => clearTimeout(timer)
    }, [mode])

    const titles = {
        generate: 'Building Your Interview Strategy',
        load: 'Loading Your Plan',
        'cover-letter': 'Generating Your Cover Letter',
    }

    const subtitles = {
        generate: 'Our AI is analysing your profile against the job requirements. This usually takes 20–40 seconds.',
        load: 'Hang tight while we fetch your report.',
        'cover-letter': 'Crafting a tailored cover letter for this role. This takes about 15–25 seconds.',
    }

    return (
        <div className='ls-overlay'>
            <div className='ls-card'>

                {/* Animated orb */}
                <div className='ls-orb'>
                    <div className='ls-orb__ring ls-orb__ring--1' />
                    <div className='ls-orb__ring ls-orb__ring--2' />
                    <div className='ls-orb__ring ls-orb__ring--3' />
                    <span className='ls-orb__icon'>
                        {steps[activeStep]?.icon}
                    </span>
                </div>

                <h2 className='ls-title'>{titles[mode]}</h2>
                <p className='ls-subtitle'>{subtitles[mode]}</p>

                {/* Step list */}
                <ul className='ls-steps'>
                    {steps.map((step, i) => {
                        const state =
                            i < activeStep ? 'done' :
                            i === activeStep ? 'active' : 'pending'
                        return (
                            <li key={i} className={`ls-step ls-step--${state}`}>
                                <span className='ls-step__indicator'>
                                    {state === 'done' ? (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    ) : state === 'active' ? (
                                        <span className='ls-step__spinner' />
                                    ) : (
                                        <span className='ls-step__dot' />
                                    )}
                                </span>
                                <span className='ls-step__label'>{step.label}</span>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </div>
    )
}

export default LoadingScreen
