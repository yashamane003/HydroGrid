import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
                const { data } = await axios.get(`http://localhost:5000/api/admin/users/${id}`, config);
                setSelectedUser(data);
                setLoading(false);
            } catch (error) {
                alert('Failed to fetch user details');
                navigate('/admin-dashboard');
            }
        };

        if (adminUser.role === 'admin') {
            fetchUserDetails();
        } else {
            navigate('/dashboard');
        }
    }, [id, adminUser, navigate]);

    const handleRemoveDevice = async (deviceId) => {
        if (!window.confirm('Are you sure you want to remove this device?')) return;
        try {
            const config = { headers: { Authorization: `Bearer ${adminUser.token}` } };
            await axios.delete(`http://localhost:5000/api/admin/devices/${deviceId}`, config);
            
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
        <div className="container" style={{ padding: '3rem 4rem' }}>
            <button onClick={() => navigate('/admin-dashboard')} style={{ marginBottom: '1rem', border: 'none', background: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '1rem' }}>
                ← Back to Dashboard
            </button>

            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#111827' }}>{selectedUser.user.name}</h1>
                <p style={{ color: '#6b7280' }}>User Overview & Activity</p>
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
                                <span style={{ fontWeight: 500 }}>{dev.name || dev.deviceId}</span>
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
                    <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No devices registered.</p>
                )}
            </div>
        </div>
    );
};

export default AdminUserDetail;
