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
                </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
                    <div className="card glass-card" style={{ background: 'white', padding: '1.25rem', display: 'flex', flexDirection: 'column', border: '1px solid var(--glass-stroke)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--glass-stroke)', paddingBottom: '16px' }}>
                            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 700 }}>Telemetry Histogram</h3>
                            
                            <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-canvas)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--glass-stroke)' }}>
                                {['ph', 'tds', 'temp', 'humidity'].map(tab => (
                                    <button 
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        style={{ 
                                            padding: '0.35rem 0.75rem', 
                                            background: activeTab === tab ? 'white' : 'transparent', 
                                            color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                                            border: activeTab === tab ? '1px solid var(--glass-stroke)' : 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: activeTab === tab ? 700 : 600,
                                            fontSize: '0.7rem',
                                            boxShadow: activeTab === tab ? 'var(--shadow-sm)' : 'none'
                                        }}
                                    >
                                        {tab === 'temp' ? 'TEMP' : tab.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ flex: 1, minHeight: '300px' }}>
                             <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={history}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-stroke)" />
                                    <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} stroke="var(--text-muted)" tick={{fontSize: 9, fontWeight: 700}} axisLine={false} tickLine={false} />
                                    <YAxis domain={activeTab === 'ph' ? [4, 9] : ['auto', 'auto']} stroke="var(--text-muted)" tick={{fontSize: 9, fontWeight: 700}} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{ background: 'white', border: '1px solid var(--glass-stroke)', borderRadius: '8px', boxShadow: 'var(--shadow-premium)', fontSize: '0.75rem' }} 
                                        labelFormatter={(t) => new Date(t).toLocaleString()} 
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey={getChartDataKey(activeTab)} 
                                        stroke={getChartColor(activeTab)} 
                                        strokeWidth={3} 
                                        dot={false} 
                                        activeDot={{ r: 6, fill: getChartColor(activeTab), stroke: 'white', strokeWidth: 2 }} 
                                        name={activeTab.toUpperCase()} 
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* RIGHT: Control Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="card glass-card" style={{ background: 'white', padding: '1.25rem', border: '1px solid var(--glass-stroke)' }}>
                            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 700, borderBottom: '1px solid var(--glass-stroke)', paddingBottom: '0.5rem' }}>
                                System Actuation
                            </h3>
                            
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                <button className="btn btn-primary" style={{ width: '100%', fontSize: '0.75rem', padding: '0.65rem' }} onClick={() => sendCommand('SET_PH', { target: 6.5 })}>
                                    Calibrate pH Strategy &rarr;
                                </button>
                                <button className="btn" style={{ width: '100%', background: 'white', border: '1px solid var(--glass-stroke)', color: 'var(--text-main)', fontSize: '0.75rem', padding: '0.65rem' }} onClick={() => sendCommand('DOSE_NUTRIENTS')}>
                                    Dose Concentration
                                </button>
                            </div>
                        </div>

                        <div className="card glass-card" style={{ background: 'white', padding: '1.25rem', border: '1px solid var(--glass-stroke)' }}>
                             <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 700, borderBottom: '1px solid var(--glass-stroke)', paddingBottom: '0.5rem' }}>
                                Motor Actuation
                            </h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <MotorControl label="Inlet Pump" status={latest?.motorInStatus} onOn={() => motorAction('in', 'ON')} onOff={() => motorAction('in', 'OFF')} disabled={latest?.status !== 'online'} />
                                <MotorControl label="Outlet Pump" status={latest?.motorOutStatus} onOn={() => motorAction('out', 'ON')} onOff={() => motorAction('out', 'OFF')} disabled={latest?.status !== 'online'} />
                                <MotorControl label="pH Up (Base)" status={latest?.motorPhUpStatus} onOn={() => motorAction('phup', 'ON')} onOff={() => motorAction('phup', 'OFF')} disabled={latest?.status !== 'online'} />
                                <MotorControl label="pH Down (Acid)" status={latest?.motorPhDownStatus} onOn={() => motorAction('phdown', 'ON')} onOff={() => motorAction('phdown', 'OFF')} disabled={latest?.status !== 'online'} />
                                <MotorControl label="Nutrient A" status={latest?.motorNutrientAStatus} onOn={() => motorAction('nutrienta', 'ON')} onOff={() => motorAction('nutrienta', 'OFF')} disabled={latest?.status !== 'online'} />
                                <MotorControl label="Nutrient B" status={latest?.motorNutrientBStatus} onOn={() => motorAction('nutrientb', 'ON')} onOff={() => motorAction('nutrientb', 'OFF')} disabled={latest?.status !== 'online'} />
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

const MotorControl = ({ label, status, onOn, onOff, disabled }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid var(--glass-stroke)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: 600 }}>{label}</div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button 
                disabled={disabled}
                onClick={onOn}
                style={{ 
                    padding: '0.45rem 0.75rem', 
                    borderRadius: '6px', 
                    border: '1px solid var(--glass-stroke)',
                    background: status === 'ON' ? 'var(--primary)' : 'white',
                    color: status === 'ON' ? 'white' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.6rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: disabled ? 0.5 : 1,
                    minWidth: '50px'
                }}
            >
                ON
            </button>
            <button 
                disabled={disabled}
                onClick={onOff}
                style={{ 
                    padding: '0.45rem 0.75rem', 
                    borderRadius: '6px', 
                    border: '1px solid var(--glass-stroke)',
                    background: status === 'OFF' ? '#64748b' : 'white',
                    color: status === 'OFF' ? 'white' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.6rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: disabled ? 0.5 : 1,
                    minWidth: '50px'
                }}
            >
                OFF
            </button>
        </div>
    </div>
);

export default Analytics;
