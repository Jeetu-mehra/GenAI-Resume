import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router'
import { useAuth } from '../features/auth/hooks/useAuth'

const Navbar = () => {
    const { user, handleLogout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const onLogout = async () => {
        try {
            await handleLogout()
            navigate('/login')
        } catch (err) {
            console.error('Logout failed:', err)
        }
    }

    // Helper to check if a link is active based on current path and search query
    const isActive = (path, tabParam = null) => {
        if (location.pathname !== path) return false
        if (tabParam) {
            const searchParams = new URLSearchParams(location.search)
            const currentTab = searchParams.get('tab') || 'dashboard'
            return currentTab === tabParam
        }
        return true
    }

    return (
        <nav className='global-navbar'>
            <div className='navbar-container'>
                {/* Brand Logo */}
                <Link to='/?tab=dashboard' className='navbar-brand'>
                    <div className='brand-logo'>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 2 7 12 12 22 7 12 2" />
                            <polyline points="2 17 12 22 22 17" />
                            <polyline points="2 12 12 17 22 12" />
                        </svg>
                    </div>
                    <span className='brand-name'>Elevate<span className='highlight'>AI</span></span>
                </Link>

                {/* Navigation Links */}
                <div className='navbar-menu'>
                    <Link 
                        to='/?tab=dashboard' 
                        className={`navbar-link ${isActive('/', 'dashboard') ? 'navbar-link--active' : ''}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>
                        Dashboard
                    </Link>
                    <Link 
                        to='/?tab=builder' 
                        className={`navbar-link ${isActive('/', 'builder') ? 'navbar-link--active' : ''}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        Create Prep Plan
                    </Link>
                    <Link 
                        to='/?tab=mock' 
                        className={`navbar-link ${isActive('/', 'mock') ? 'navbar-link--active' : ''}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        Mock Interview
                    </Link>
                </div>

                {/* User Section */}
                {user && (
                    <div className='navbar-user-section'>
                        <div className='user-avatar'>
                            {user.username ? user.username.substring(0, 2).toUpperCase() : 'AI'}
                        </div>
                        <div className='user-info-dropdown-trigger'>
                            <span className='user-name'>{user.username}</span>
                        </div>
                        <button className='navbar-logout-btn' onClick={onLogout} title='Sign Out'>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </nav>
    )
}

export default Navbar
