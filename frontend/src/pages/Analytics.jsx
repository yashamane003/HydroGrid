import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { APP_BASE_URL } from '../config';

const Analytics = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [latest, setLatest] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [activeTab, setActiveTab] = useState('ph');

    useEffect(() => {
        const storedUser = localStorage.getItem('userInfo');
        if (!storedUser) {
             navigate('/login');
             return;
        }
        setUserInfo(JSON.parse(storedUser));
    }, [navigate]);

    // Poll Data
    useEffect(() => {
        if (!userInfo) return;

        const fetchData = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                
                // Get History
                const { data: hist } = await axios.get(`${APP_BASE_URL}/api/devices/${id}/telemetry/history?limit=20`, config);
                setHistory(hist);

                // Get Latest
                const { data: last } = await axios.get(`${APP_BASE_URL}/api/devices/${id}/telemetry`, config);
                setLatest(last);

            } catch (error) {
                console.error("Fetch error", error);
            }
        };

        fetchData(); // Initial
        const interval = setInterval(fetchData, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [id, userInfo]);

    // Command Handler
    const sendCommand = async (command, payload = {}) => {
        if (!userInfo) return;
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.post(`${APP_BASE_URL}/api/devices/${id}/commands`, { command, payload }, config);
            // Re-fetch latest to update UI immediately
            const { data: last } = await axios.get(`${APP_BASE_URL}/api/devices/${id}/telemetry`, config);
            setLatest(last);
        } catch (error) {
            console.error('Failed to send command:', error.response?.data?.message || error.message);
        }
    };

    const startControlCycle = async () => {
        if (!userInfo) return;
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.post(`${APP_BASE_URL}/api/devices/${id}/start-control`, {}, config);
            const { data: last } = await axios.get(`${APP_BASE_URL}/api/devices/${id}/telemetry`, config);
            setLatest(last);
        } catch (error) {
            alert('Failed to start control: ' + (error.response?.data?.message || error.message));
        }
    };

    const motorAction = (motorKey, action) => {
        // action is 'ON' or 'OFF'
        let key = motorKey.toUpperCase();
        // Handle special mapping if needed (phup -> PH_UP)
        if (key === 'PHUP') key = 'PH_UP';
        if (key === 'PHDOWN') key = 'PH_DOWN';
        if (key === 'NUTRIENTA') key = 'NUTRIENT_A';
        if (key === 'NUTRIENTB') key = 'NUTRIENT_B';
        
        const command = `MOTOR_${key}_${action}`;
        sendCommand(command);
    };

    // Chart Data Helpers
    const getChartColor = (type) => {
        const colors = { ph: '#1e4ed8', tds: '#3b82f6', temp: '#60a5fa', humidity: '#93c5fd' };
        return colors[type] || '#2563eb';
    };

    const getChartDataKey = (type) => `data.${type === 'temp' ? 'temperature' : type}`;

    if (!latest && history.length === 0) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8f9fa' }}>
            <div style={{ fontSize: '1.2rem', color: '#6b7280' }}>Loading Analytics...</div>
        </div>
    );

    return (
        <div className="container animate-fade-in">
            <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>Analytics & Intelligence</h1>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Node: {id.slice(-6).toUpperCase()}</p>
                </div>
                <button 
                    onClick={() => navigate('/dashboard')} 
                    className="btn btn-secondary"
                    style={{ padding: '12px 24px' }}
                >
                    &larr; Return to Fleet
                </button>
            </header>

            <div style={{ padding: '0', width: '100%', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                
                {/* Stats Row */}
                {latest && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}>
                        <StatCard label="pH" value={latest.status === 'online' ? (latest.data?.ph?.toFixed(1) || '--') : 'OFFLINE'} unit="" color="var(--primary)" />
                        <StatCard label="TDS" value={latest.status === 'online' ? (latest.data?.tds || '--') : 'OFFLINE'} unit={latest.status === 'online' ? "ppm" : ""} color="var(--primary)" />
                        <StatCard label="W-TEMP" value={latest.status === 'online' ? (latest.data?.temperature || '--') : 'OFFLINE'} unit={latest.status === 'online' ? "°C" : ""} color="var(--primary)" />
                        <StatCard label="HUMIDITY" value={latest.status === 'online' ? (latest.data?.humidity || '--') : 'OFFLINE'} unit={latest.status === 'online' ? "%" : ""} color="var(--primary)" />
                        <StatCard label="WATER LVL" value={latest.status === 'online' ? (latest.data?.waterLevelCm || '--') : 'OFFLINE'} unit={latest.status === 'online' ? "cm" : ""} color="var(--primary)" />
                </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
                    <div className="card glass-card" style={{ background: 'white', padding: '1.25rem', display: 'flex', flexDirection: 'column', border: '1px solid var(--glass-stroke)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--glass-stroke)', paddingBottom: '16px' }}>
                            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 700 }}>Telemetry Activity</h3>
                        </div>
                            
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', minHeight: '400px' }}>
                             <ChartBox data={history} dataKey="data.ph" color="#ec4899" title="pH Level" domain={[4, 9]} />
                             <ChartBox data={history} dataKey="data.tds" color="#3b82f6" title="TDS (ppm)" />
                             <ChartBox data={history} dataKey="data.temperature" color="#10b981" title="Temperature (°C)" />
                             <ChartBox data={history} dataKey="data.humidity" color="#8b5cf6" title="Humidity (%)" />
                        </div>
                    </div>

                    {/* RIGHT: Control Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="card glass-card" style={{ background: 'white', padding: '1.25rem', border: '1px solid var(--glass-stroke)' }}>
                            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 700, borderBottom: '1px solid var(--glass-stroke)', paddingBottom: '0.5rem' }}>
                                System Actuation
                            </h3>
                            
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                <button 
                                    className="btn btn-primary" 
                                    style={{ 
                                        width: '100%', fontSize: '0.75rem', padding: '0.85rem',
                                        opacity: (latest?.controlState !== 'MONITOR_ONLY' || latest?.status !== 'online') ? 0.5 : 1,
                                        cursor: (latest?.controlState !== 'MONITOR_ONLY' || latest?.status !== 'online') ? 'not-allowed' : 'pointer',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                                    }} 
                                    disabled={latest?.controlState !== 'MONITOR_ONLY' || latest?.status !== 'online'}
                                    onClick={startControlCycle}
                                >
                                    {latest?.controlState !== 'MONITOR_ONLY' ? (
                                        <>
                                            <div className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }}></div>
                                            Control Cycle Active
                                        </>
                                    ) : (
                                        'Start One-Time Control'
                                    )}
                                </button>
                            </div>

                            <ControlTimeline controlState={latest?.controlState || 'MONITOR_ONLY'} />
                        </div>
                        
                        <div className="card glass-card" style={{ background: 'white', padding: '1.25rem', border: '1px solid var(--glass-stroke)' }}>
                            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 700, borderBottom: '1px solid var(--glass-stroke)', paddingBottom: '0.5rem' }}>
                                Motor Actuation Activity
                            </h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Motors are now controlled automatically by the hardware cycle. 
                                Below is the recent control timeline based on telemetry.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                                {history.filter(h => h.data?.controlState && h.data.controlState !== 'MONITOR_ONLY').slice(0, 5).map((h, i) => (
                                    <div key={i} style={{ padding: '8px', background: 'var(--bg-canvas)', borderRadius: '6px', fontSize: '0.7rem' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{h.data.controlState}</div>
                                        <div style={{ color: 'var(--text-muted)' }}>{new Date(h.timestamp).toLocaleTimeString()}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

// UI Components
const StatCard = ({ label, value, unit, color }) => (
    <div className="card glass-card" style={{ padding: '0.85rem 1rem', border: '1px solid var(--glass-stroke)' }}>
        <h4 style={{ margin: '0 0 0.35rem 0', color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.05em' }}>{label}</h4>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)' }}>{value}</div>
            {unit && <small style={{ fontSize: '0.65rem', fontWeight: 500, color: 'var(--text-muted)' }}>{unit}</small>}
        </div>
    </div>
);

const ChartBox = ({ data, dataKey, color, title, domain = ['auto', 'auto'] }) => (
    <div style={{ background: 'var(--bg-canvas)', borderRadius: '8px', padding: '12px', border: '1px solid var(--glass-stroke)', display: 'flex', flexDirection: 'column' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{title}</h4>
        <div style={{ flex: 1, minHeight: '120px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <XAxis dataKey="timestamp" hide />
                    <YAxis domain={domain} hide />
                    <Tooltip contentStyle={{ fontSize: '0.7rem' }} labelFormatter={(t) => new Date(t).toLocaleTimeString()} />
                    <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    </div>
);

const ControlTimeline = ({ controlState }) => {
    const states = [
        { id: 'MONITOR_ONLY', label: 'Monitoring Mode (Idle)', color: '#64748b' },
        { id: 'CONTROL_PH', label: 'Reading & Adjusting pH', color: '#ec4899' },
        { id: 'WAIT_AFTER_PH', label: 'Waiting 1 min (Mixing)', color: '#f59e0b' },
        { id: 'CONTROL_TDS', label: 'Reading & Adjusting TDS', color: '#3b82f6' },
        { id: 'WAIT_AFTER_TDS', label: 'Waiting 1 min (Mixing)', color: '#f59e0b' }
    ];
    
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Control Timeline</h4>
            {states.map((state, idx) => {
                const isActive = controlState === state.id;
                return (
                    <div key={state.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: isActive || state.id === 'MONITOR_ONLY' ? 1 : 0.4, transition: 'all 0.3s ease' }}>
                        <div style={{ 
                            width: '12px', height: '12px', borderRadius: '50%', 
                            background: isActive ? state.color : 'transparent',
                            border: `2px solid ${isActive ? state.color : '#cbd5e1'}`,
                            boxShadow: isActive ? `0 0 8px ${state.color}80` : 'none',
                            transition: 'all 0.3s ease'
                        }} />
                        <div style={{ fontSize: '0.75rem', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--text-main)' : 'var(--text-muted)' }}>
                            {state.label}
                        </div>
                        {isActive && state.id !== 'MONITOR_ONLY' && (
                            <div className="spinner" style={{ width: '10px', height: '10px', borderWidth: '2px', borderColor: `${state.color} transparent transparent transparent`, marginLeft: 'auto' }}></div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default Analytics;
