import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DeviceDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [device, setDevice] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (!userInfo) {
            navigate('/login');
            return;
        }

        const user = JSON.parse(userInfo);
        const config = {
            headers: { Authorization: `Bearer ${user.token}` },
        };

        const fetchData = async () => {
            try {
                // 1. Get Device Details/Metadata (We might need a specific endpoint or just filter from list)
                // For now, we'll hit the list and filter, or add a specific GET /devices/:id endpoint later.
                // Or we can rely on the history endpoint to confirm access.
                
                // 2. Get History
                const { data: historyData } = await axios.get(`http://localhost:5000/api/devices/${id}/telemetry/history?limit=20`, config);
                setHistory(historyData);
                
                // Mock device name if we don't have a single-device endpoint yet, 
                // or assume access is good if history returns.
                setDevice({ deviceId: id }); 

                setLoading(false);
            } catch (error) {
                console.error("Error fetching details", error);
                setLoading(false);
            }
        };

        fetchData();
        // Poll every 10 seconds
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);

    }, [id, navigate]);

    if (loading) return <div className="container">Loading Details...</div>;

    return (
        <div className="container animate-fade-in">
            <button onClick={() => navigate('/dashboard')} className="btn-secondary" style={{ marginBottom: '1rem' }}>
                &larr; Back to Dashboard
            </button>
            
            <header style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Device Analytics</h1>
                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>ID: {id}</p>
            </header>

            <div style={{ display: 'grid', gap: '2rem' }}>
                
                {/* pH Chart */}
                <div className="auth-box">
                    <h3>pH Levels (Last 20 Readings)</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer>
                            <LineChart data={history}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).toLocaleTimeString()} />
                                <YAxis domain={[0, 14]} />
                                <Tooltip labelFormatter={(t) => new Date(t).toLocaleString()} />
                                <Legend />
                                <Line type="monotone" dataKey="data.ph" stroke="#8884d8" name="pH" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* TDS Chart */}
                <div className="auth-box">
                    <h3>TDS (ppm)</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer>
                            <LineChart data={history}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).toLocaleTimeString()} />
                                <YAxis />
                                <Tooltip labelFormatter={(t) => new Date(t).toLocaleString()} />
                                <Legend />
                                <Line type="monotone" dataKey="data.tds" stroke="#82ca9d" name="TDS" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Temp & Humidity */}
                <div className="auth-box">
                    <h3>Temperature & Humidity</h3>
                     <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer>
                            <LineChart data={history}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).toLocaleTimeString()} />
                                <YAxis yAxisId="left" />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip labelFormatter={(t) => new Date(t).toLocaleString()} />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="data.temperature" stroke="#ff7300" name="Temp (°C)" />
                                <Line yAxisId="right" type="monotone" dataKey="data.humidity" stroke="#387908" name="Humidity (%)" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DeviceDetails;
