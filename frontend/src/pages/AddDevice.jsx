import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { APP_BASE_URL } from '../config';

const AddDevice = () => {
    const navigate = useNavigate();
    const [pairingToken, setPairingToken] = useState('');
    const [deviceName, setDeviceName] = useState('');
    const [loading, setLoading] = useState(false);
    const [showManual, setShowManual] = useState(false);
    
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    const handleClaim = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.post(`${APP_BASE_URL}/api/devices/claim`,
                { pairingToken, name: deviceName || undefined },
                config
            );
            alert('Device successfully claimed');
            navigate('/dashboard'); 
        } catch (error) {
            alert(error.response?.data?.message || 'Invalid pairing token');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container animate-fade-in" style={{ paddingBottom: '32px' }}>
            <div className="card glass-card" style={{ maxWidth: '600px', width: '100%', padding: '32px' }}>
                <div style={{ marginBottom: '2rem' }}> {/* Removed textAlign: 'center', adjusted marginBottom */}
                    <div style={{ 
                        width: '56px', height: '56px', background: 'var(--primary)', 
                        borderRadius: '16px', display: 'flex', alignItems: 'center', 
                        justifyContent: 'center', marginBottom: '1.25rem', // Removed auto margin for centering
                        boxShadow: '0 6px 14px var(--primary-glow)' 
                    }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 21.5C12 21.5 4 15.5 4 10C4 5.58172 7.58172 2 12 2C16.4183 2 20 5.58172 20 10C20 15.5 12 21.5 12 21.5Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.65rem', letterSpacing: '-0.03em' }}>Register System</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Select your hardware integration path</p>
                </div>


                {/* USB PROVISIONING OPTION */}
                <div 
                    onClick={() => navigate('/provision-device')}
                    style={{
                        border: '1px solid var(--glass-stroke)', borderRadius: '12px', 
                        padding: '1.25rem', cursor: 'pointer', marginBottom: '1.5rem',
                        background: 'var(--bg-canvas)', display: 'flex', alignItems: 'center', gap: '1rem'
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: '0.95rem', fontWeight: 700 }}>Recommended</h3>
                        <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>Provision via USB cable</p>
                    </div>
                    <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem' }}>PROCEED &rarr;</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                    <button 
                        onClick={() => setShowManual(!showManual)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                        {showManual ? 'Hide Manual Setup' : 'Have a 6-digit pairing code?'}
                    </button>
                </div>

                {showManual && (
                    <div style={{ marginTop: '2rem', borderTop: '1px solid #f1f5f9', paddingTop: '2rem' }}>
                        <form onSubmit={handleClaim} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">PAIRING TOKEN</label>
                                <input 
                                    className="form-input"
                                    type="text" placeholder="------" 
                                    value={pairingToken}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, ''); 
                                        if (val.length <= 6) setPairingToken(val);
                                    }}
                                    style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.5rem', fontWeight: 800 }}
                                    required
                                />
                            </div>
                            
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">FRIENDLY NAME</label>
                                <input 
                                    className="form-input"
                                    type="text" placeholder="e.g. Garden Unit 1"
                                    value={deviceName}
                                    onChange={(e) => setDeviceName(e.target.value)}
                                />
                            </div>
                            
                            <button 
                                type="submit" 
                                className="btn btn-primary btn-full"
                                disabled={pairingToken.length !== 6 || loading}
                                style={{ padding: '1rem', borderRadius: '12px', marginTop: '1rem' }}
                            >
                                {loading ? 'Validating...' : 'Claim Device'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddDevice;
