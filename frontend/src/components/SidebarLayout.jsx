import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';

const SidebarLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Mock user if localStorage is empty to prevent crash during UI dev
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || { name: 'John Doe' };

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    const navItemStyle = (path) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        color: isActive(path) ? '#ffffff' : 'var(--sidebar-text)',
        backgroundColor: isActive(path) ? 'rgba(59, 130, 246, 0.1)' : 'transparent', // Subtle highlight
        borderLeft: isActive(path) ? '3px solid var(--primary)' : '3px solid transparent',
        textDecoration: 'none',
        marginBottom: '0.5rem',
        fontWeight: isActive(path) ? '600' : '500',
        transition: 'all 0.2s',
        borderRadius: '0 8px 8px 0', // Modern feel
    });

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
            {/* Sidebar (Fixed width, full height) */}
            <aside style={{ 
                width: '260px', 
                backgroundColor: 'var(--sidebar-bg)', 
                color: 'white', 
                display: 'flex', 
                flexDirection: 'column',
                flexShrink: 0
            }}>
                {/* Brand Header */}
                <div style={{ padding: '2rem 1.5rem 1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', letterSpacing: '-0.02em' }}>HydroMonitor</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--sidebar-text)', marginTop: '0.25rem' }}>
                        {userInfo.name}
                    </p>
                </div>

                {/* Navigation Items */}
                <nav style={{ flex: 1, padding: '2rem 0' }}>
                    {userInfo.role === 'admin' ? (
                        <>
                             {/* Admin-Only Navigation */}
                             <Link to="/admin-dashboard" style={navItemStyle('/admin-dashboard')}>
                                <span>🛡️</span> Admin Dashboard
                            </Link>
                        </>
                    ) : (
                        <>
                            {/* User-Only Navigation */}
                            <Link to="/dashboard" style={navItemStyle('/dashboard')}>
                                <span>📊</span> Dashboard
                            </Link>
                            <Link to="/add-device" style={navItemStyle('/add-device')}>
                                <span>➕</span> Add Device
                            </Link>
                            <Link to="/provision-device" style={navItemStyle('/provision-device')}>
                                <span>🔌</span> Configure Device
                            </Link>
                        </>
                    )}
                </nav>

                {/* Logout (Bottom) */}
                <div style={{ padding: '1.5rem' }}>
                    <button 
                        onClick={handleLogout} 
                        className="btn btn-danger"
                        style={{ width: '100%' }}
                    >
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-canvas)' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default SidebarLayout;
