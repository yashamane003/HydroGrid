
import { useNavigate } from 'react-router-dom';
import { useProvision } from '../context/ProvisionContext';

const ProvisionDevice = () => {
    const navigate = useNavigate();
    const { 
        status, 
        logs, 
        deviceMac, 
        config, 
        setConfig, 
        connectToDevice, 
        saveConfigToDevice, 
        retryGetInfo 
    } = useProvision();

    if (!('serial' in navigator)) return <div>Not Supported</div>;

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f9fafb' }}>
            <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2rem', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#111827' }}>🔌 Configure Device</h2>
                    <p style={{ color: '#6b7280' }}>Connect ESP32 via USB.</p>
                </div>

                {/* Main Action Area */}
                <div style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    
                    {status === 'disconnected' && (
                        <div style={{ textAlign: 'center' }}>
                             <button onClick={connectToDevice} className="btn-primary" style={{ padding: '0.75rem 2rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem' }}>
                                Connect to ESP32
                            </button>
                        </div>
                    )}

                    {(status === 'connected' || status === 'saving' || status === 'polling' || status === 'complete' || status === 'error') && (
                        <div>
                             {deviceMac ? (
                                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#eff6ff', borderRadius: '6px', textAlign: 'center', fontSize: '0.9rem', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                                    Detected MAC: <strong>{deviceMac}</strong>
                                </div>
                            ) : (
                                <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>Waiting for device details...</p>
                                    <button onClick={retryGetInfo} style={{ background: 'white', border: '1px solid #d1d5db', color: '#374151', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' }}>
                                        🔄 Retry Fetch Info
                                    </button>
                                </div>
                            )}

                            {/* Config Form (Disable if polling/complete) */}
                            {status !== 'complete' && status !== 'polling' && status !== 'error' && (
                                <div style={{ opacity: status === 'saving' ? 0.7 : 1, pointerEvents: status === 'saving' ? 'none' : 'auto', transition: 'opacity 0.3s' }}>
                                     <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>WiFi SSID</label>
                                        <input type="text" value={config.ssid} onChange={e => setConfig({...config, ssid: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.95rem' }} placeholder="Enter WiFi Name" />
                                    </div>
                                     <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>WiFi Password</label>
                                        <input type="password" value={config.password} onChange={e => setConfig({...config, password: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.95rem' }} placeholder="Enter WiFi Password" />
                                    </div>

                                    <button onClick={saveConfigToDevice} className="btn-primary" 
                                        disabled={status === 'saving' || !config.ssid}
                                        style={{ width: '100%', padding: '0.75rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', opacity: (!config.ssid) ? 0.6 : 1 }}>
                                        {status === 'saving' ? 'Saving...' : 'Save & Connect'}
                                    </button>
                                </div>
                            )}

                            {status === 'polling' && (
                                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                                    <div className="spinner" style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>⏳</div>
                                    <p style={{ fontWeight: 500, color: '#111827', marginBottom: '0.5rem' }}>Connecting to WiFi...</p>
                                    <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>Verifying via Cloud...</p>
                                </div>
                            )}

                            {status === 'error' && (
                                <div style={{ textAlign: 'center', padding: '1.5rem', border: '1px solid #fecaca', borderRadius: '8px', background: '#fef2f2', marginTop: '1rem' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>❌</div>
                                    <h3 style={{ color: '#991b1b', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Connection Failed</h3>
                                    <p style={{ fontSize: '0.9rem', color: '#b91c1c' }}>
                                        Could not verify connection.
                                    </p>
                                    <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', background: '#dc2626', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                        Try Again
                                    </button>
                                </div>
                            )}

                            {status === 'complete' && (
                                <div style={{ textAlign: 'center', marginTop: '1rem', padding: '1.5rem', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #d1fae5' }}>
                                    <h3 style={{ color: '#065f46', marginBottom: '0.5rem' }}>Success!</h3>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                                    <p style={{ marginBottom: '1.5rem', color: '#047857' }}>
                                        Device verified and added to your dashboard.
                                    </p>
                                    <button onClick={() => navigate('/dashboard')} style={{ background: '#059669', color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                                        Go to Dashboard
                                    </button>
                                </div>
                            )}
                            
                        </div>
                    )}
                </div>

                {/* Logs Area */}
                <div style={{ marginTop: '2rem', background: '#111827', color: '#34d399', padding: '1rem', borderRadius: '6px', fontSize: '0.8rem', fontFamily: 'monospace', height: '120px', overflowY: 'auto' }}>
                        {logs.length === 0 ? '> Ready...' : logs.map((l, i) => <div key={i} style={{ marginBottom: '2px' }}>{'> ' + l}</div>)}
                </div>
            </div>
            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default ProvisionDevice;
