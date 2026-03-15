import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { APP_BASE_URL } from '../config';

const AdminUserDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const adminUser = JSON.parse(localStorage.getItem('userInfo')) || {};
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${adminUser.token}` } };
                const { data } = await axios.get(`${APP_BASE_URL}/api/admin/users/${id}`, config);
                setSelectedUser(data);
                setLoading(false);
            } catch (error) {
                console.error('Fetch user details failed:', error);
                alert('Failed to fetch user details');
                navigate('/admin-dashboard');
            }
        };

        if (adminUser.role === 'admin' && adminUser.token) {
            fetchUserDetails();
        } else if (adminUser.role && adminUser.role !== 'admin') {
            navigate('/dashboard');
        }
    }, [id, adminUser.token, adminUser.role, navigate]);

    const handleRemoveDevice = async (deviceId) => {
        if (!window.confirm('Are you sure you want to remove this device?')) return;
        try {
            const config = { headers: { Authorization: `Bearer ${adminUser.token}` } };
            await axios.delete(`${APP_BASE_URL}/api/admin/devices/${deviceId}`, config);
            
            // Update local state
            setSelectedUser(prev => ({
                ...prev,
                devices: prev.devices.filter(d => d._id !== deviceId)
            }));
        } catch (error) {
            alert('Failed to delete device');
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading user details...</div>;

    return (
        <div className="container animate-fade-in">
            <button onClick={() => navigate('/admin-dashboard')} style={{ marginBottom: '1rem', border: 'none', background: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '1rem' }}>
                ← Back to Dashboard
            </button>

            <header style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{selectedUser.user.name}</h1>
                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>User Overview & Activity</p>
            </header>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                    <div>
                        <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>Email</p>
                        <p style={{ fontWeight: 500, fontSize: '1.1rem' }}>{selectedUser.user.email}</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>Joined</p>
                        <p style={{ fontWeight: 500, fontSize: '1.1rem' }}>{new Date(selectedUser.user.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>

                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Device Activity (Last 7 Days)</h3>
                <div style={{ width: '100%', height: 300, marginBottom: '3rem' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={selectedUser.activity}>
                            <defs>
                                <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="day" style={{ fontSize: '0.8rem' }} />
                            <YAxis style={{ fontSize: '0.8rem' }} />
                            <Tooltip labelFormatter={(label, payload) => {
                                if (payload && payload.length > 0) return payload[0].payload.date;
                                return label;
                            }} />
                            <Area type="monotone" dataKey="usage" stroke="#10b981" fillOpacity={1} fill="url(#colorUsage)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Registered Devices ({selectedUser.devices.length})</h3>
                {selectedUser.devices.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {selectedUser.devices.map(dev => (
                            <li key={dev._id} style={{ padding: '1rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{dev.name || dev.deviceId}</span>
                                    {dev.selectedPlant ? (
                                        <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, marginTop: '2px' }}>
                                            Active Profile: {dev.selectedPlant.name}
                                        </span>
                                    ) : (
                                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, marginTop: '2px' }}>
                                            No Profile Active
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', background: dev.status === 'online' ? '#d1fae5' : '#f3f4f6', borderRadius: '999px', color: dev.status === 'online' ? '#065f46' : '#374151' }}>
                                        {dev.status}
                                    </span>
                                    <button 
                                        onClick={() => handleRemoveDevice(dev._id)}
                                        style={{ border: 'none', background: '#fee2e2', color: '#b91c1c', fontSize: '0.8rem', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}
                                    >
                                        Remove Device
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p style={{ color: '#6b7280', fontStyle: 'italic', padding: '1rem' }}>No devices registered.</p>
                )}

                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', marginTop: '3rem' }}>User's Plant Library ({selectedUser?.plants?.length || 0})</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', fontWeight: 500 }}>Private ecosystem definitions specific to this user's company.</p>
                {selectedUser?.plants?.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {selectedUser.plants.map(p => (
                            <div key={p._id} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>{p.name}</h4>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: '#e0f2fe', color: '#0369a1', borderRadius: '4px', fontWeight: 700 }}>pH: {p.targetPh}</span>
                                    <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: '#f0fdf4', color: '#166534', borderRadius: '4px', fontWeight: 700 }}>TDS: {p.targetTds}</span>
                                </div>
                                {p.usage && <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '0.75rem 0 0 0', fontStyle: 'italic' }}>{p.usage}</p>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No custom plants defined.</p>
                )}
            </div>
        </div>
    );
};

export default AdminUserDetail;
