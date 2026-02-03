import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { APP_BASE_URL } from '../config';

const Dashboard = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('userInfo')) || {};
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const { data } = await axios.get(`${APP_BASE_URL}/api/devices`, config);
                setDevices(data);
                setLoading(false);
            } catch (error) {
                console.error('Fetch devices failed:', error);
                setLoading(false);
            }
        };

        if (user.token) {
            fetchDevices();
            const interval = setInterval(fetchDevices, 5000); // Polling every 5 seconds
            return () => clearInterval(interval);
        } else {
            navigate('/login');
        }
    }, [user.token, navigate]);

    return (
        <div className="container" style={{ padding: '3rem 4rem' }}>
            {/* Header Section */}
            <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#111827' }}>Dashboard</h1>
                    <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>Welcome back, {user.name}!</p>
                </div>
                <button 
                    onClick={() => navigate('/add-device')}
                    style={{ 
                        background: '#3b82f6', 
                        color: 'white', 
                        padding: '0.75rem 1.5rem', 
                        borderRadius: '8px', 
                        border: 'none', 
                        fontSize: '1rem', 
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)'
                    }}
                >
                    + Add Device
                </button>
            </header>

            {loading ? <div style={{ textAlign: 'center', padding: '2rem' }}>Loading devices...</div> : (
                <>
                    {devices.length === 0 ? (
                        /* Empty State */
                        <div className="card" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '4rem 2rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1.5rem', opacity: 0.5 }}>📱</div>
                            <h3 style={{ fontSize: '1.5rem', color: '#374151', marginBottom: '1rem' }}>No devices connected yet.</h3>
                            <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '2rem' }}>
                                Add your first IoT device to start monitoring and controlling it remotely.
                            </p>
                            <button 
                                onClick={() => navigate('/add-device')}
                                style={{ background: '#3b82f6', color: 'white', padding: '0.75rem 2rem', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                            >
                                Add Device
                            </button>
                        </div>
                    ) : (
                        /* Device Grid */
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                            {devices.map((device) => (
                                <div 
                                    key={device._id} 
                                    className="card" 
                                    style={{ 
                                        padding: '0', 
                                        transition: 'transform 0.2s', 
                                        cursor: 'pointer',
                                        position: 'relative'
                                    }}
                                    onClick={() => navigate(`/analytics/${device._id}`)}
                                >
                                    {/* Delete Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm('Are you sure you want to delete this device?')) {
                                                const deleteDev = async () => {
                                                    try {
                                                        const config = { headers: { Authorization: `Bearer ${user.token}` } };
                                                        await axios.delete(`${APP_BASE_URL}/api/devices/${device._id}`, config);
                                                        setDevices(devices.filter(d => d._id !== device._id));
                                                    } catch (err) {
                                                        alert('Failed to delete device');
                                                    }
                                                };
                                                deleteDev();
                                            }
                                        }}
                                        style={{
                                            position: 'absolute',
                                            top: '1rem',
                                            right: '1rem',
                                            background: '#fee2e2',
                                            color: '#ef4444',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '28px',
                                            height: '28px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            zIndex: 10
                                        }}
                                    >
                                        &times;
                                    </button>

                                    <div style={{ padding: '1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ fontSize: '1.1rem', color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{device.name}</h3>
                                        <span style={{ 
                                            padding: '0.25rem 0.6rem', 
                                            borderRadius: '999px', 
                                            fontSize: '0.75rem', 
                                            fontWeight: 600,
                                            background: device.status === 'online' ? '#d1fae5' : '#f3f4f6',
                                            color: device.status === 'online' ? '#065f46' : '#6b7280',
                                            textTransform: 'capitalize'
                                        }}>
                                            {device.status}
                                        </span>
                                    </div>
                                    <div style={{ padding: '1.5rem' }}>
                                        {/* Latest Sensor Values Block */}
                                        {device.latestData ? (
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.025em' }}>pH Level</div>
                                                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{device.latestData.ph?.toFixed(1) || '--'}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.025em' }}>Temp</div>
                                                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{device.latestData.temperature?.toFixed(1) || '--'}°C</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.025em' }}>TDS</div>
                                                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{device.latestData.tds?.toFixed(0) || '--'} <small style={{ fontSize: '0.6rem', color: '#64748b' }}>ppm</small></div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.025em' }}>Hum</div>
                                                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{device.latestData.humidity?.toFixed(0) || '--'}%</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ marginBottom: '1.25rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px dotted #cbd5e1', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
                                                Waiting for sensor data...
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>Last Seen</span>
                                            <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{device.lastSeen ? new Date(device.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}</span>
                                        </div>
                                        
                                        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                                            <span style={{ color: '#3b82f6', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                Open Analytics & Control <span style={{ marginLeft: '4px' }}>&rarr;</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Dashboard;
