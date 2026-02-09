import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const adminUser = JSON.parse(localStorage.getItem('userInfo')) || {};
    const [stats, setStats] = useState({ liveUsers: 0, registeredUsers: 0, totalDevices: 0, graphData: [] });
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('7d');
    const [searchQuery, setSearchQuery] = useState('');

    if (adminUser.role !== 'admin') {
         const handleLogout = () => {
             localStorage.removeItem('userInfo');
             window.location.href = '/login';
         };

         return (
            <div className="container" style={{ textAlign: 'center', marginTop: '4rem', color: '#ef4444' }}>
                <h2>Access Denied</h2>
                <p>You do not have permission to view this page.</p>
                <div style={{ marginTop: '2rem', padding: '1rem', background: '#fee2e2', borderRadius: '8px', display: 'inline-block' }}>
                    <div style={{ textAlign: 'left', background: '#fff', padding: '0.5rem', borderRadius: '4px', margin: '1rem 0', fontSize: '0.8rem', fontFamily: 'monospace', overflowX: 'auto' }}>
                        <strong>Debug Info:</strong>
                        <pre>{JSON.stringify(adminUser, null, 2)}</pre>
                    </div>
                    <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#b91c1c' }}>
                        You are logged in as a regular user.<br/>
                        Please logout and use the <strong>Admin Demo Login</strong>.
                    </p>
                    <button 
                        onClick={handleLogout}
                        style={{
                            marginTop: '1rem',
                            padding: '0.5rem 1rem',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Logout Now
                    </button>
                </div>
            </div>
        );
    }

    // Removed fetchUserDetails and handleRemoveDevice and Modal logic
    // as they are now in AdminUserDetail page

    useEffect(() => {
        const fetchData = async () => {
            try {
                const config = {
                    headers: { Authorization: `Bearer ${adminUser.token}` },
                };

                // Fetch analytics with period and users separately
                const statsRes = await axios.get(`http://localhost:5000/api/admin/analytics?period=${period}`, config);
                const usersRes = await axios.get('http://localhost:5000/api/admin/users', config);
                
                setStats(statsRes.data);
                setUsers(usersRes.data);
                setLoading(false);
            } catch (error) {
                console.error("Admin Fetch Error:", error);
                setLoading(false);
            }
        };

        if (adminUser.token) {
            fetchData();
        }
    }, [adminUser.token, period]); // Refetch when period changes

    return (
        <div className="container animate-fade-in">
            {/* 1. Header */}
            <header style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.5rem', marginBottom: '4px', color: '#111827', fontWeight: 700 }}>Admin Dashboard</h1>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>Platform analytics and user overview</p>
            </header>

            {loading ? <p>Loading Admin Data...</p> : (
                <>
                    {/* 2. Analytics Overview Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                        {/* Live Users Card */}
                        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '2rem', color: '#111827', marginBottom: '4px', fontWeight: 800 }}>{stats.liveUsers}</h3>
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live Users (1h)</p>
                        </div>

                        {/* Registered Users Card */}
                        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '1.6rem', color: '#111827', marginBottom: '0.15rem', fontWeight: 800 }}>{stats.registeredUsers}</h3>
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Registered Users</p>
                        </div>

                        {/* Total Devices Card */}
                        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '1.6rem', color: '#111827', marginBottom: '0.15rem', fontWeight: 800 }}>{stats.totalDevices}</h3>
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Devices</p>
                        </div>
                    </div>

                    {/* 3. Usage Graph Section */}
                    <div style={{ marginBottom: '32px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-premium)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.1rem', color: '#111827', margin: 0, fontWeight: 700 }}>Growth Overview</h2>
                            <select 
                                value={period} 
                                onChange={(e) => setPeriod(e.target.value)}
                                style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem' }}
                            >
                                <option value="7d">Last 7 Days</option>
                                <option value="1m">Last 30 Days</option>
                                <option value="3m">Last 3 Months</option>
                                <option value="6m">Last 6 Months</option>
                                <option value="12m">Last 12 Months</option>
                                <option value="all">All Time</option>
                            </select>
                        </div>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.graphData}>
                                    <defs>
                                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" style={{ fontSize: '0.8rem' }} />
                                    <YAxis allowDecimals={false} style={{ fontSize: '0.8rem' }} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="users" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 4. Users List Section */}
                    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Users Overview</h2>
                            <input 
                                type="text" 
                                placeholder="Search users..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ padding: '12px 20px', borderRadius: '8px', border: '1px solid #d1d5db', width: '280px', fontSize: '0.875rem' }}
                            />
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: '#f9fafb', color: '#6b7280', fontSize: '0.85rem' }}>
                                    <tr>
                                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>User</th>
                                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Role</th>
                                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Status</th>
                                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Last Active</th>
                                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Created At</th>
                                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())).map((u) => (
                                        <tr key={u._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '1rem 1.5rem', cursor: 'pointer' }} onClick={() => navigate(`/admin/users/${u._id}`)}>
                                                <div style={{ fontWeight: 500, color: '#3b82f6' }}>{u.name}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{u.email}</div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <span style={{ 
                                                    background: u.role === 'admin' ? '#dbeafe' : '#f3f4f6', 
                                                    color: u.role === 'admin' ? '#1e40af' : '#374151',
                                                    padding: '0.2rem 0.6rem',
                                                    borderRadius: '999px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600
                                                }}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <span style={{ color: '#10b981', fontWeight: 500, fontSize: '0.9rem' }}>Active</span>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: '#6b7280' }}>
                                                {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: '#6b7280' }}>
                                                {new Date(u.createdAt).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>
                                                <button 
                                                    onClick={() => navigate(`/admin/users/${u._id}`)}
                                                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', background: 'white', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}
                                                >
                                                    View Activity
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminDashboard;
