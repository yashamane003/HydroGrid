import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AddDevice = () => {
    const navigate = useNavigate();
    const [pairingToken, setPairingToken] = useState('');
    const [deviceName, setDeviceName] = useState('');
    
    // Retrieve user token
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    const handleClaim = async (e) => {
        e.preventDefault();
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };
            const { data } = await axios.post(
                'http://localhost:5000/api/devices/claim',
                { pairingToken, name: deviceName },
                config
            );
            
            if (data.deviceSecret) {
                alert(`Device Claimed Successfully!\n\nIMPORTANT: Update your ESP32:\n\nDevice ID: ${data.deviceId}\nDevice Secret: ${data.deviceSecret}`);
            } else {
                alert('Device claimed successfully!');
            }
            navigate('/dashboard'); // Return to dashboard
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Error claiming device');
        }
    };

    return (
        <div>
            {/* Back button optional since Sidebar exists, but helpful for flow */}
            {/* <button onClick={() => navigate('/dashboard')} ... >Back</button> */}
            
            <div className="auth-box" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h2>Claim New Device</h2>
                <p>Enter the 6-digit pairing token shown on your device.</p>
                <form onSubmit={handleClaim} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                     <input 
                        type="text" 
                        placeholder="Pairing Token" 
                        value={pairingToken}
                        onChange={(e) => setPairingToken(e.target.value)}
                        required
                        style={{ padding: '0.8rem' }}
                    />
                    <input 
                        type="text" 
                        placeholder="Device Name (e.g. Tank 1)" 
                        value={deviceName}
                        onChange={(e) => setDeviceName(e.target.value)}
                        style={{ padding: '0.8rem' }}
                    />
                    <button 
                        type="submit" 
                        className="btn-primary" 
                        disabled={!pairingToken}
                        style={{ opacity: pairingToken ? 1 : 0.5 }}
                    >
                        Claim Device
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddDevice;
