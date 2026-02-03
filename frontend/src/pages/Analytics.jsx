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
            alert(`Command '${command}' sent!`);
        } catch (error) {
            alert('Failed to send command: ' + (error.response?.data?.message || error.message));
        }
    };

    // Chart Data Helpers
    const getChartColor = (type) => {
        switch(type) {
            case 'ph': return '#10b981';
            case 'tds': return '#3b82f6';
            case 'temp': return '#f59e0b';
            case 'humidity': return '#8b5cf6';
            default: return '#10b981';
        }
    };

    const getChartDataKey = (type) => `data.${type === 'temp' ? 'temperature' : type}`;

    if (!latest && history.length === 0) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8f9fa' }}>
            <div style={{ fontSize: '1.2rem', color: '#6b7280' }}>Loading Analytics...</div>
        </div>
    );

    return (
        <div style={{ background: '#f8f9fa', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            
            {/* Green Top Bar */}
            <div style={{ background: '#10b981', padding: '1rem 2rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, color: 'white' }}>Analytics & Control</h1>
                    <p style={{ margin: 0, opacity: 0.9, fontSize: '0.85rem' }}>Device ID: {id}</p>
                </div>
                <button 
                    onClick={() => navigate('/dashboard')} 
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}
                >
                    &larr; Dashboard
                </button>
            </div>

            <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box', flex: 1, display: 'flex', flexDirection: 'column' }}>
                
                {/* Stats Row */}
                {latest && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                        <StatCard 
                            label="pH Level" 
                            value={latest.data?.ph || '--'} 
                            sublabel="Current Reading"
                        />
                         <StatCard 
                            label="TDS (ppm)" 
                            value={latest.data?.tds || '--'} 
                            sublabel="Water Quality"
                        />
                         <StatCard 
                            label="Temperature" 
                            value={`${latest.data?.temperature || '--'}°C`} 
                            sublabel="Environment"
                        />
                         <StatCard 
                            label="Humidity" 
                            value={`${latest.data?.humidity || '--'}%`} 
                            sublabel="Ambient"
                        />
                    </div>
                )}

                {/* Main Content Area */}
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '2rem', flex: 1 }}>
                    
                    {/* LEFT: Chart Section */}
                    <div className="card" style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem' }}>
                            <h3 style={{ margin: 0, color: '#374151', fontSize: '1.1rem' }}>Consumption over time</h3>
                            
                            {/* Tabs */}
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {['ph', 'tds', 'temp', 'humidity'].map(tab => (
                                    <button 
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        style={{ 
                                            padding: '0.5rem 1rem', 
                                            background: activeTab === tab ? '#10b981' : 'white', 
                                            color: activeTab === tab ? 'white' : '#6b7280',
                                            border: activeTab === tab ? 'none' : '1px solid #e5e7eb',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontWeight: 500,
                                            textTransform: 'capitalize',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        {tab === 'temp' ? 'Temp' : tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ flex: 1, minHeight: '300px' }}>
                             <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={history}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} stroke="#9ca3af" axisLine={false} tickLine={false} />
                                    <YAxis domain={activeTab === 'ph' ? [0, 14] : ['auto', 'auto']} stroke="#9ca3af" axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} 
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="card" style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1.5rem 0', color: '#111827', fontSize: '1rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
                                Quick Actions
                            </h3>
                            
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <button className="btn" style={{ width: '100%', background: '#10b981', color: 'white', padding: '0.75rem', borderRadius: '6px' }} onClick={() => sendCommand('SET_PH', { target: 6.5 })}>
                                    Calibrate pH (6.5)
                                </button>
                                <button className="btn" style={{ width: '100%', background: 'white', border: '1px solid #d1d5db', color: '#374151', padding: '0.75rem', borderRadius: '6px' }} onClick={() => sendCommand('DOSE_NUTRIENTS')}>
                                    Dose Nutrients
                                </button>
                            </div>
                        </div>

                        <div className="card" style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.5rem' }}>
                             <h3 style={{ margin: '0 0 1.5rem 0', color: '#111827', fontSize: '1rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
                                Motors
                            </h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Inlet Pump</div>
                                    <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                                        <button style={{ flex: 1, padding: '0.5rem', border: 'none', background: 'white', cursor: 'pointer', borderRight: '1px solid #e5e7eb', color: '#10b981', fontWeight: 600 }} onClick={() => sendCommand('MOTOR_IN_ON')}>ON</button>
                                        <button style={{ flex: 1, padding: '0.5rem', border: 'none', background: '#f9fafb', cursor: 'pointer', color: '#6b7280' }} onClick={() => sendCommand('MOTOR_IN_OFF')}>OFF</button>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Outlet Pump</div>
                                    <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                                        <button style={{ flex: 1, padding: '0.5rem', border: 'none', background: 'white', cursor: 'pointer', borderRight: '1px solid #e5e7eb', color: '#10b981', fontWeight: 600 }} onClick={() => sendCommand('MOTOR_OUT_ON')}>ON</button>
                                        <button style={{ flex: 1, padding: '0.5rem', border: 'none', background: '#f9fafb', cursor: 'pointer', color: '#6b7280' }} onClick={() => sendCommand('MOTOR_OUT_OFF')}>OFF</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

// UI Components
const StatCard = ({ label, value, sublabel }) => (
    <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#6b7280', fontSize: '0.9rem', fontWeight: 500 }}>{label}</h4>
        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.5rem' }}>{sublabel}</div>
    </div>
);

export default Analytics;
