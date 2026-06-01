import React from 'react'
import Navbar from './Navbar'
import { Outlet } from 'react-router'

const Layout = () => {
    return (
        <div className='app-layout'>
            <Navbar />
            <main className='app-main-content'>
                <Outlet />
            </main>
            <footer className='global-footer'>
                <div className='footer-container'>
                    <div className='footer-left'>
                        <div className='footer-brand'>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className='footer-logo-icon'>
                                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                <polyline points="2 17 12 22 22 17" />
                                <polyline points="2 12 12 17 22 12" />
                            </svg>
                            <span className='footer-brand-name'>Elevate<span className='highlight'>AI</span></span>
                        </div>
                        <p className='footer-copyright'>&copy; 2026 ElevateAI. Powered by Gemini. All rights reserved.</p>
                    </div>
                    <div className='footer-right'>
                        <div className='footer-links-group'>
                            <a href='#'>Privacy Policy</a>
                            <a href='#'>Terms of Service</a>
                            <a href='#'>Support Center</a>
                            <a href='#'>Feedback</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Layout
