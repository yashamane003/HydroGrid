import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Analytics = () => {
    const { id } = useParams(); // deviceId (or _id)
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [latest, setLatest] = useState(null);
    const [userInfo, setUserInfo] = useState(null);

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
                const { data: hist } = await axios.get(`http://localhost:5000/api/devices/${id}/telemetry/history?limit=20`, config);
                setHistory(hist);

                // Get Latest
                const { data: last } = await axios.get(`http://localhost:5000/api/devices/${id}/telemetry`, config);
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
            await axios.post(`http://localhost:5000/api/devices/${id}/commands`, { command, payload }, config);
            alert(`Command '${command}' sent!`);
        } catch (error) {
            alert('Failed to send command: ' + (error.response?.data?.message || error.message));
        }
    };

    if (!latest && history.length === 0) return <div className="container">Loading Analytics...</div>;

    return (
        <div className="container">
             <button onClick={() => navigate('/dashboard')} className="btn-secondary" style={{ marginBottom: '1rem' }}>
                &larr; Back to Dashboard
            </button>

            <header className="auth-header">
                <h1>Analytics & Control</h1>
                <p>Device: {id}</p>
                {latest && (
                    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', justifyContent: 'center' }}>
                         <span className="badge" style={{background: '#d1fae5', color:'#065f46'}}>pH: {latest.data?.ph || '--'}</span>
                         <span className="badge" style={{background: '#dbeafe', color:'#1e40af'}}>TDS: {latest.data?.tds || '--'}</span>
                         <span className="badge" style={{background: '#ffedd5', color:'#9a3412'}}>Temp: {latest.data?.temperature || '--'}°C</span>
                    </div>
                )}
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                {/* LEFT: Charts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="auth-box">
                        <h3>pH Levels</h3>
                        <div style={{ height: '250px' }}>
                             <ResponsiveContainer>
                                <LineChart data={history}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).toLocaleTimeString()} />
                                    <YAxis domain={[0, 14]} />
                                    <Tooltip labelFormatter={(t) => new Date(t).toLocaleString()} />
                                    <Line type="monotone" dataKey="data.ph" stroke="#8884d8" name="pH" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    {/* Add more charts here if needed */}
                </div>

                {/* RIGHT: Controls (Authoritative) */}
                <div className="auth-box" style={{ height: 'fit-content' }}>
                    <h2>Controls</h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <button className="btn-primary" onClick={() => sendCommand('SET_PH', { target: 6.5 })}>Calibrate pH</button>
                        <button className="btn-primary" onClick={() => sendCommand('DOSE_NUTRIENTS')}>Dose Nutrients</button>
                        
                        <h4>Motors</h4>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                             <button className="btn-primary" style={{ background: '#10b981' }} onClick={() => sendCommand('MOTOR_IN_ON')}>Inlet ON</button>
                             <button className="btn-primary" style={{ background: '#ef4444' }} onClick={() => sendCommand('MOTOR_IN_OFF')}>Inlet OFF</button>
                        </div>
                         <div style={{ display: 'flex', gap: '0.5rem' }}>
                             <button className="btn-primary" style={{ background: '#10b981' }} onClick={() => sendCommand('MOTOR_OUT_ON')}>Outlet ON</button>
                             <button className="btn-primary" style={{ background: '#ef4444' }} onClick={() => sendCommand('MOTOR_OUT_OFF')}>Outlet OFF</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
