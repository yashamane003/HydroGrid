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
    
    // Retrieve user token
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    const handleClaim = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };
            await axios.post(
                `${APP_BASE_URL}/api/devices/claim`,
                { pairingToken, name: deviceName || undefined },
                config
            );
            
            alert('Device successfully claimed');
            navigate('/dashboard'); 
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Invalid or expired pairing token');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '80vh',
            padding: '2rem'
        }}>
            <div className="card" style={{ 
                maxWidth: '500px', 
                width: '100%', 
                padding: '2.5rem',
                textAlign: 'center',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                borderRadius: '12px',
                background: '#fff' 
            }}>
                <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: '#111827' }}>Add New Device</h2>
                <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
                    Choose how you want to set up your device.
                </p>

                {/* Primary Option: USB */}
                <div 
                    onClick={() => navigate('/provision-device')}
                    style={{
                        border: '2px solid #3b82f6',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        cursor: 'pointer',
                        marginBottom: '1.5rem',
                        background: '#eff6ff',
                        transition: 'all 0.2s',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <div style={{ fontSize: '2rem', marginRight: '1rem' }}>🔌</div>
                    <div>
                        <h3 style={{ margin: 0, color: '#1e40af', fontSize: '1.1rem' }}>Configure via USB</h3>
                        <p style={{ margin: '0.25rem 0 0 0', color: '#1e3a8a', fontSize: '0.9rem' }}>
                            Recommended for new devices.
                        </p>
                    </div>
                    <div style={{ marginLeft: 'auto', color: '#3b82f6', fontWeight: 'bold' }}>&rarr;</div>
                </div>

                {/* Secondary Option: Manual */}
                <button 
                    onClick={() => setShowManual(!showManual)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#6b7280',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        marginBottom: '1rem'
                    }}
                >
                    {showManual ? 'Hide Manual Setup' : 'I have a pairing code'}
                </button>

                {showManual && (
                    <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                        <div style={{ height: '1px', background: '#e5e7eb', marginBottom: '1.5rem' }}></div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#374151' }}>Manual Entry</h3>
                        <form onSubmit={handleClaim} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input 
                                type="text" 
                                placeholder="Pairing Token (6 digits)" 
                                value={pairingToken}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, ''); 
                                    if (val.length <= 6) setPairingToken(val);
                                }}
                                pattern="\d{6}"
                                maxLength={6}
                                required
                                style={{ 
                                    padding: '0.8rem', 
                                    fontSize: '1.1rem', 
                                    textAlign: 'center', 
                                    letterSpacing: '0.2rem',
                                    borderRadius: '6px',
                                    border: '1px solid #d1d5db'
                                }}
                            />
                            
                            <input 
                                type="text" 
                                placeholder="Device Name (e.g. Living Room)" 
                                value={deviceName}
                                onChange={(e) => setDeviceName(e.target.value)}
                                style={{ 
                                    padding: '0.8rem',
                                    borderRadius: '6px',
                                    border: '1px solid #d1d5db'
                                }}
                            />
                            
                            <button 
                                type="submit" 
                                className="btn-primary" 
                                disabled={pairingToken.length !== 6 || loading}
                                style={{ 
                                    padding: '0.8rem',
                                    background: '#4b5563', // Grey for secondary action
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    opacity: (pairingToken.length === 6 && !loading) ? 1 : 0.6,
                                    cursor: (pairingToken.length === 6 && !loading) ? 'pointer' : 'not-allowed'
                                }}
                            >
                                {loading ? 'Claiming...' : 'Claim Device'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default AddDevice;
