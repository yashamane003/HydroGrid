import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

const SidebarLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || { name: 'User' };

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const navItemStyle = (path) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '12px 20px',
        color: isActive(path) ? '#ffffff' : 'var(--sidebar-text)',
        backgroundColor: isActive(path) ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
        borderLeft: isActive(path) ? '4px solid var(--primary)' : '4px solid transparent',
        textDecoration: 'none',
        marginBottom: '4px',
        fontWeight: isActive(path) ? '600' : '500',
        transition: 'all 0.2s ease',
        borderRadius: '0 8px 8px 0',
        fontSize: '0.875rem',
        letterSpacing: '0.01em',
    });

    const categoryHeaderStyle = {
        fontSize: '0.7rem',
        fontWeight: 800,
        color: '#475569',
        letterSpacing: '0.1em',
        padding: '20px 20px 8px',
        textTransform: 'uppercase',
        opacity: 0.6
    };

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative', backgroundColor: 'var(--bg-canvas)' }}>
            {/* Mobile Header */}
            <div style={{
                display: 'none',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '56px',
                backgroundColor: 'var(--sidebar-bg)',
                zIndex: 100,
                alignItems: 'center',
                padding: '0 1rem',
                justifyContent: 'space-between',
                boxShadow: '0 2px 15px rgba(0,0,0,0.1)'
            }} className="mobile-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.5C12 21.5 4 15.5 4 10C4 5.58172 7.58172 2 12 2C16.4183 2 20 5.58172 20 10C20 15.5 12 21.5 12 21.5Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <span style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>HydroMonitor</span>
                </div>
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                    {isMobileMenuOpen ? '✕' : '☰'}
                </button>
            </div>

            {/* Sidebar Overlay for Mobile */}
            {isMobileMenuOpen && (
                <div 
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.6)',
                        backdropFilter: 'blur(3px)',
                        zIndex: 140,
                    }}
                />
            )}

            {/* Sidebar Drawer */}
            <aside style={{ 
                width: '280px', 
                backgroundColor: 'var(--sidebar-bg)', 
                color: 'white', 
                display: 'flex', 
                flexDirection: 'column',
                flexShrink: 0,
                transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 150,
                boxShadow: '4px 0 10px rgba(0,0,0,0.05)',
                position: 'relative'
            }} className={`sidebar-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                
                {/* Logo Section */}
                <div style={{ padding: '1.5rem 1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }} className="sidebar-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ 
                            width: '36px', height: '36px', background: 'var(--primary)', 
                            borderRadius: '10px', display: 'flex', alignItems: 'center', 
                            justifyContent: 'center', boxShadow: '0 6px 14px var(--primary-glow)'
                        }}>
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.5C12 21.5 4 15.5 4 10C4 5.58172 7.58172 2 12 2C16.4183 2 20 5.58172 20 10C20 15.5 12 21.5 12 21.5Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', letterSpacing: '-0.02em', margin: 0 }}>HydroMonitor</h2>
                    </div>
                </div>

                <nav style={{ flex: 1, padding: '0.25rem 0', overflowY: 'auto' }}>
                    {userInfo.role === 'admin' ? (
                        <>
                            <div style={categoryHeaderStyle}>Administration</div>
                            <Link to="/admin-dashboard" style={navItemStyle('/admin-dashboard')}>
                                Control Center
                            </Link>
                        </>
                    ) : (
                        <>
                            <div style={categoryHeaderStyle}>Monitoring</div>
                            <Link to="/dashboard" style={navItemStyle('/dashboard')}>
                                Live Stats
                            </Link>

                            <div style={categoryHeaderStyle}>Device Management</div>
                            <Link to="/add-device" style={navItemStyle('/add-device')}>
                                Register
                            </Link>
                            <Link to="/provision-device" style={navItemStyle('/provision-device')}>
                                Provisioning
                            </Link>

                            <div style={categoryHeaderStyle}>Resources</div>
                            <Link to="/plants" style={navItemStyle('/plants')}>
                                Plant Library
                            </Link>
                        </>
                    )}
                </nav>

                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', paddingLeft: '0.2rem' }}>
                        <div className="status-pulse" style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--primary)', '--status-glow': 'var(--primary-glow)' }}></div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.75rem', color: 'white', fontWeight: 800 }}>{userInfo.name.split(' ')[0]}</span>
                            <span style={{ fontSize: '0.55rem', color: 'var(--sidebar-text)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleLogout} 
                        className="btn btn-danger"
                        style={{ width: '100%', borderRadius: '6px', padding: '0.45rem', fontSize: '0.75rem' }}
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main style={{ 
                flexGrow: 1, 
                overflowY: 'auto', 
                backgroundColor: 'var(--bg-canvas)',
                padding: '0 0 32px 0',
                position: 'relative',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column'
            }} className="main-content">
                <Outlet />
            </main>

            <style>{`
                @media (max-width: 768px) {
                    .mobile-header {
                        display: flex !important;
                    }
                    .sidebar-nav {
                        position: fixed !important;
                        top: 0;
                        left: 0;
                        bottom: 0;
                        transform: translateX(-100%);
                    }
                    .sidebar-nav.mobile-open {
                        transform: translateX(0);
                    }
                    .main-content {
                        padding-top: 64px;
                    }
                    .sidebar-header {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default SidebarLayout;
