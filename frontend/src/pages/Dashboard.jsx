import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('userInfo')) || {};
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const { data } = await axios.get('http://localhost:5000/api/devices', config);
                setDevices(data);
                setLoading(false);
            } catch (error) {
                console.error('Fetch devices failed:', error);
                setLoading(false);
            }
        };

        if (user.token) {
            fetchDevices();
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

            {loading ? <p>Loading devices...</p> : (
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                            {devices.map((device) => (
                                <div 
                                    key={device._id} 
                                    className="card" 
                                    style={{ 
                                        padding: '0', 
                                        transition: 'transform 0.2s', 
                                        cursor: 'pointer' 
                                    }}
                                    onClick={() => navigate(`/analytics/${device._id}`)}
                                    // Add hover effect via CSS class or inline logic if needed
                                >
                                    <div style={{ padding: '1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ fontSize: '1.25rem', color: '#111827', margin: 0 }}>{device.name || device.deviceId}</h3>
                                        <span style={{ 
                                            padding: '0.25rem 0.75rem', 
                                            borderRadius: '999px', 
                                            fontSize: '0.8rem', 
                                            fontWeight: 600,
                                            background: device.status === 'online' ? '#d1fae5' : '#f3f4f6',
                                            color: device.status === 'online' ? '#065f46' : '#374151'
                                        }}>
                                            {device.status}
                                        </span>
                                    </div>
                                    <div style={{ padding: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Type</span>
                                            <span style={{ fontWeight: 500 }}>ESP32 Sensor</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Last Seen</span>
                                            <span style={{ fontWeight: 500 }}>{device.lastSeen ? new Date(device.lastSeen).toLocaleDateString() : 'Never'}</span>
                                        </div>
                                        
                                        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f9fafb', textAlign: 'center' }}>
                                            <span style={{ color: '#3b82f6', fontWeight: 600, fontSize: '0.9rem' }}>View Analytics &rarr;</span>
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
