import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { APP_BASE_URL } from '../config';

const Dashboard = () => {
    const [devices, setDevices] = useState([]);
    const [plants, setPlants] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    
    const user = JSON.parse(localStorage.getItem('userInfo')) || {};

    const fetchData = async () => {
        if (!user.token) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const [devRes, plantRes] = await Promise.all([
                axios.get(`${APP_BASE_URL}/api/devices`, config),
                axios.get(`${APP_BASE_URL}/api/plants`, config)
            ]);
            setDevices(devRes.data);
            setPlants(plantRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Fetch failed:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user.token) {
            navigate('/login');
            return;
        }
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [user.token, navigate]);

    // Stunning SVG Icons
    const Icons = {
        pH: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M5 12h14"/></svg>,
        Nutrients: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>,
        Temp: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>,
        Humidity: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5s-3 3.5-3 5.5a7 7 0 0 0 7 7Z"/></svg>
    };

    return (
        <div className="container animate-fade-in">
            <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: '0' }}>Live Dashboard</h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500, margin: '4px 0 0' }}>Real-time telemetry from your ecosystems</p>
                </div>
                <button 
                    onClick={() => navigate('/add-device')}
                    className="btn btn-primary"
                    style={{ padding: '12px 24px' }}
                >
                    Register New Device
                </button>
            </header>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>
                    <div className="spinner" style={{ marginBottom: '0.75rem' }}></div>
                    Syncing with hardware...
                </div>
            ) : (
                <>
                {/* SYSTEM HEALTH MONITOR */}
                <div style={{ 
                    marginBottom: '32px', 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                    gap: '24px' 
                }}>
                    <div className="card glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'white' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                        <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nodes Online</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{devices.filter(d => d.status === 'online').length}</div>
                        </div>
                    </div>
                    <div className="card glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'white' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }}></div>
                        <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nodes Offline</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{devices.filter(d => d.status !== 'online').length}</div>
                        </div>
                    </div>
                </div>

                <div className="responsive-grid">
                    {devices.length === 0 ? (
                        <div className="card glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}></div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>No Active Systems</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '350px', margin: '0 auto 1.5rem' }}>Your dashboard is waiting for its first inhabitant.</p>
                            <button onClick={() => navigate('/add-device')} className="btn btn-primary">Register Now</button>
                        </div>
                    ) : (
                        devices.map((device) => (
                            <div 
                                key={device._id} 
                                className="card glass-card" 
                                style={{ 
                                    padding: '0', 
                                    overflow: 'hidden',
                                    position: 'relative',
                                    background: 'white',
                                    border: '1px solid var(--glass-stroke)',
                                    opacity: device.status === 'online' ? 1 : 0.65,
                                    filter: device.status === 'online' ? 'none' : 'grayscale(0.4)',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {/* Header Section */}
                                <div style={{ 
                                    padding: '1rem 1.25rem',
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    borderBottom: '1px solid var(--glass-stroke)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div>
                                            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.01em' }}>{device.name}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.1rem' }}>
                                                <div className="status-pulse" style={{ 
                                                    width: '6px', height: '6px', borderRadius: '50%', 
                                                    background: device.status === 'online' ? 'var(--primary)' : '#94a3b8',
                                                    '--status-glow': device.status === 'online' ? 'var(--primary-glow)' : 'transparent'
                                                }}></div>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{device.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm('Dissociate device?')) {
                                                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                                                axios.delete(`${APP_BASE_URL}/api/devices/${device._id}`, config)
                                                    .then(() => fetchData());
                                            }
                                        }}
                                        style={{
                                            background: '#f8fafc', color: 'var(--text-muted)', border: '1px solid var(--glass-stroke)',
                                            padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.65rem',
                                            fontWeight: 800, cursor: 'pointer'
                                        }}
                                    >
                                        DEL
                                    </button>
                                </div>

                                {/* Telemetry Area */}
                                <div style={{ padding: '1.25rem' }}>
                                    {device.latestData ? (() => {
                                        const selectedPlantData = plants.find(p => p._id === device.selectedPlant);
                                        const getStatusColor = (val, target, margin) => {
                                            if (device.status !== 'online') return 'var(--text-muted)';
                                            if (!target) return 'var(--text-main)';
                                            return (val > target + margin || val < target - margin) ? 'var(--text-muted)' : 'var(--primary)';
                                        };

                                        return (
                                            <div style={{ position: 'relative' }}>
                                                {device.status !== 'online' && (
                                                    <div style={{ 
                                                        position: 'absolute', top: '-10px', right: 0, 
                                                        fontSize: '0.55rem', fontWeight: 900, color: 'var(--text-muted)',
                                                        background: 'var(--bg-canvas)', padding: '2px 6px', borderRadius: '4px',
                                                        letterSpacing: '0.05em', border: '1px solid var(--glass-stroke)', zIndex: 1
                                                    }}>
                                                        STALE DATA
                                                    </div>
                                                )}
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                                                    {/* pH BOX */}
                                                    <div style={{ 
                                                        padding: '0.85rem', background: 'white', borderRadius: '12px', 
                                                        border: '1px solid var(--glass-stroke)',
                                                        boxShadow: 'var(--shadow-inner)'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                                                            <span style={{ opacity: 0.5, transform: 'scale(0.7)' }}>{Icons.pH}</span>
                                                            <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>pH Level</span>
                                                        </div>
                                                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: device.status === 'online' ? getStatusColor(device.latestData.ph, selectedPlantData?.targetPh, 0.2) : 'var(--text-muted)', letterSpacing: '-0.01em' }}>
                                                            {device.status === 'online' ? (device.latestData.ph?.toFixed(1) || '--') : 'OFFLINE'}
                                                        </div>
                                                    </div>

                                                    {/* NUTRIENTS BOX */}
                                                    <div style={{ 
                                                        padding: '0.85rem', background: 'white', borderRadius: '12px', 
                                                        border: '1px solid var(--glass-stroke)',
                                                        boxShadow: 'var(--shadow-inner)'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                                                            <span style={{ opacity: 0.5, transform: 'scale(0.7)' }}>{Icons.Nutrients}</span>
                                                            <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nutrients</span>
                                                        </div>
                                                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: device.status === 'online' ? getStatusColor(device.latestData.tds, selectedPlantData?.targetTds, 50) : 'var(--text-muted)', letterSpacing: '-0.01em' }}>
                                                            {device.status === 'online' ? <>{device.latestData.tds?.toFixed(0) || '--'} <small style={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.6 }}>ppm</small></> : 'OFFLINE'}
                                                        </div>
                                                    </div>

                                                    {/* TEMPERATURE BOX */}
                                                    <div style={{ 
                                                        padding: '0.85rem', background: 'white', borderRadius: '12px', 
                                                        border: '1px solid var(--glass-stroke)',
                                                        boxShadow: 'var(--shadow-inner)'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                                                            <span style={{ opacity: 0.5, transform: 'scale(0.7)' }}>{Icons.Temp}</span>
                                                            <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Temp</span>
                                                        </div>
                                                        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: device.status === 'online' ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                                            {device.status === 'online' ? (device.latestData.temperature?.toFixed(1) || '--') + '°C' : 'OFFLINE'}
                                                        </div>
                                                    </div>

                                                    {/* HUMIDITY BOX */}
                                                    <div style={{ 
                                                        padding: '0.85rem', background: 'white', borderRadius: '12px', 
                                                        border: '1px solid var(--glass-stroke)',
                                                        boxShadow: 'var(--shadow-inner)'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                                                            <span style={{ opacity: 0.5, transform: 'scale(0.7)' }}>{Icons.Humidity}</span>
                                                            <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Humidity</span>
                                                        </div>
                                                        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: device.status === 'online' ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                                            {device.status === 'online' ? (device.latestData.humidity?.toFixed(0) || '--') + '%' : 'OFFLINE'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })() : (
                                        <div style={{ 
                                            padding: '2rem 1rem', background: 'rgba(248, 250, 252, 0.4)', 
                                            borderRadius: '12px', border: '1px dashed #e2e8f0', 
                                            textAlign: 'center', color: 'var(--text-muted)', 
                                            marginBottom: '1.25rem', fontSize: '0.8rem', fontWeight: 600
                                        }}>
                                            {device.status === 'online' ? 'NO TELEMETRY RECEIVED' : 'OFFLINE - NO SIGNAL'}
                                        </div>
                                    )}

                                    {/* Automation Selection */}
                                    <div style={{ 
                                        padding: '0.85rem', background: 'var(--bg-canvas)', 
                                        borderRadius: '12px', border: '1px solid var(--glass-stroke)',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Target Plan</span>
                                        </div>
                                        <select 
                                            value={device.selectedPlant || ''}
                                            onChange={async (e) => {
                                                const plantId = e.target.value;
                                                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                                                await axios.put(`${APP_BASE_URL}/api/devices/${device._id}/automation`, { selectedPlant: plantId, automationEnabled: !!plantId }, config);
                                                fetchData();
                                            }}
                                            style={{ 
                                                width: '100%', padding: '0.55rem 0.65rem', borderRadius: '8px', 
                                                border: '1px solid var(--glass-stroke)', fontSize: '0.8rem', 
                                                fontWeight: 700, background: 'white', color: 'var(--text-main)',
                                                cursor: 'pointer', outline: 'none'
                                            }}
                                        >
                                            <option value="">Manual Control</option>
                                            {plants.map(p => (
                                                <option key={p._id} value={p._id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div 
                                        onClick={() => navigate(`/analytics/${device._id}`)}
                                        style={{ 
                                            marginTop: '1rem', textAlign: 'center', padding: '0.5rem 0 0',
                                            color: 'var(--primary)', fontWeight: 700, fontSize: '0.75rem',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', 
                                            justifyContent: 'center', gap: '0.35rem',
                                            borderTop: '1px solid var(--glass-stroke)'
                                        }}
                                    >
                                        Analysis & Analytics &rarr;
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                </>
            )}
            
            <style>{`
                @media (max-width: 480px) {
                    .responsive-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
