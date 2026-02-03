import { createContext, useState, useRef, useEffect, useContext } from 'react';
import axios from 'axios';
import { APP_BASE_URL, DEVICE_BASE_URL } from '../config';

const ProvisionContext = createContext();

export const useProvision = () => useContext(ProvisionContext);

export const ProvisionProvider = ({ children }) => {
    const [status, setStatus] = useState('disconnected'); // disconnected, connected, saving, polling, complete, error
    const [logs, setLogs] = useState([]);
    
    // eslint-disable-next-line no-unused-vars
    const [deviceMac, setDeviceMac] = useState(null);
    const [config, setConfig] = useState({
        ssid: '',
        password: '',
        backendUrl: DEVICE_BASE_URL // Device needs the IP, not localhost
    });

    // Refs for stream handling to persist across renders/navigation
    const readerRef = useRef(null);
    const writerRef = useRef(null);
    const portRef = useRef(null);
    const pollingIntervalRef = useRef(null);

    const addLog = (msg) => {
        setLogs(prev => [...prev.slice(-4), msg]); // Keep last 5 logs for UI
    };

    // Cleanup on App unmount (mostly theoretical as App rarely unmounts)
    useEffect(() => {
        return () => {
            if (portRef.current) {
                portRef.current.close().catch(console.error);
            }
            if (pollingIntervalRef.current) {
                clearTimeout(pollingIntervalRef.current);
            }
        };
    }, []);

    const connectToDevice = async () => {
        if (!('serial' in navigator)) {
            alert('Web Serial API not supported.');
            return;
        }

        try {
            const selectedPort = await navigator.serial.requestPort();
            
            // Check if already open
            if (selectedPort.readable) {
                addLog('Port is already open. Reusing...');
            } else {
                await selectedPort.open({ baudRate: 115200 });
            }

            portRef.current = selectedPort;
            setStatus('connected');
            addLog('Connected! Fetching info...');
            
            // Setup TextEncoder (Write Loop)
            if (!writerRef.current) {
                const textEncoder = new TextEncoderStream();
                // eslint-disable-next-line no-unused-vars
                const writableStreamClosed = textEncoder.readable.pipeTo(selectedPort.writable);
                writerRef.current = textEncoder.writable.getWriter();
            }

            // Start reading loop
            readLoop(selectedPort);
            
            // ESP32 resets on serial connect. Wait for boot (2s) then send command.
            setTimeout(() => {
                addLog('Requesting Device Info...');
                sendSerialCommand({ cmd: "GET_INFO" });
            }, 2500);

        } catch (err) {
            console.error(err);
            if (err.message && err.message.includes('already open')) {
                // If we have the reference, we are good. If not, user might need to reload.
                if (portRef.current) {
                    addLog('Port active.');
                    setStatus('connected');
                } else {
                     addLog('Error: Port locked. Please RELOAD PAGE.');
                }
            } else {
                 addLog(`Connection Error: ${err.message}`);
            }
        }
    };

    const retryGetInfo = () => {
        if (writerRef.current) {
            addLog('Retrying Info Request...');
            sendSerialCommand({ cmd: "GET_INFO" });
        } else {
            addLog('Not connected.');
        }
    };

    const readLoop = async (currentPort) => {
        const textDecoder = new TextDecoderStream();
        // eslint-disable-next-line no-unused-vars
        const readableStreamClosed = currentPort.readable.pipeTo(textDecoder.writable);
        const reader = textDecoder.readable.getReader();
        readerRef.current = reader;
        
        let buffer = '';

        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                if (value) {
                    buffer += value;
                    const lines = buffer.split('\n');
                    buffer = lines.pop(); // Keep partial line
                    
                    for (const line of lines) {
                         processLine(line);
                    }
                }
            }
        } catch (error) {
            console.error(error);
            addLog(`Read Error: ${error.message}`);
        }
    };

    const processLine = (line) => {
        const text = line.trim();
        if (!text) return;
        
        // Security: Mask sensitive info in logs
        if (text.toLowerCase().includes('token') || text.toLowerCase().includes('password')) {
            addLog(`RX: [HIDDEN SENSITIVE INFO]`);
        } else {
            addLog(`RX: ${text}`);
        }

        try {
            // Strategy 1: Plain Text Match "Device MAC: XX:XX:XX:XX:XX:XX"
            const macMatch = text.match(/Device MAC:\s*([0-9A-Fa-f:]{17})/);
            if (macMatch) {
                const mac = macMatch[1].toUpperCase();
                setDeviceMac(mac);
                // addLog(`✅ MAC Capture: ${mac}`); // formatted log already shown above
                return;
            }

            // Strategy 2: JSON Match
            const match = text.match(/\{.*\}/);
            if (match) {
                const data = JSON.parse(match[0]);
                if (data.mac) {
                    setDeviceMac(data.mac);
                    addLog(`✅ MAC Detected (JSON): ${data.mac}`);
                }
            }
        } catch (e) {
            // Ignored
        }
    };

    const sendSerialCommand = async (cmdObj) => {
        if (writerRef.current) {
            await writerRef.current.write(JSON.stringify(cmdObj) + "\n");
        }
    };

    const saveConfigToDevice = async () => {
        if (!portRef.current) return;

        setStatus('saving');
        addLog('Sending configuration...');

        try {
            await sendSerialCommand({
                cmd: "SET_CONFIG",
                ssid: config.ssid,
                pass: config.password,
                url: config.backendUrl
            });

            addLog('Config sent. Waiting for connection...');
            setStatus('polling');
            
            // Start Polling Backend
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            if (deviceMac) {
                startPolling(deviceMac, userInfo?.token);
            } else {
                addLog('Warning: No MAC detected. Cannot auto-poll.');
                setStatus('complete'); // Fallback to complete if we can't verify
            }

        } catch (err) {
            console.error(err);
            addLog(`Error: ${err.message}`);
            setStatus('connected');
        }
    };

    const startPolling = (mac, userToken) => {
        let attempts = 0;
        const maxAttempts = 20; // 20 * 3s = 60s timeout

        if (pollingIntervalRef.current) clearTimeout(pollingIntervalRef.current);

        const poll = async () => {
            attempts++;
            
            try {
                // Use backend URL from config or default (Local IP for physical device access)
                // Add 2s timeout to avoid hanging requests piling up
                const { data } = await axios.get(`${APP_BASE_URL}/api/devices/status?mac=${mac}`, { timeout: 2000 });
                
                if (data.state) {
                     addLog(`Poll (${attempts}): ${data.state}`);
                } else {
                     addLog(`Poll (${attempts}): No Status`);
                }

                if (data.token) {
                    addLog('✅ Device Connected to WiFi!');
                    // AUTO CLAIM
                    await autoClaimDevice(data.token, userToken);
                    return; // Stop polling
                    
                } else if (data.state === 'PAIRED') {
                    addLog('Device is already Paired.');
                    setStatus('complete');
                    return; // Stop polling
                }
            } catch (err) {
                // Ignore errors (device might not be online yet)
                addLog(`Poll Error: ${err.message}`);
                // console.log(err);
            }

            if (attempts >= maxAttempts) {
                setStatus('error');
                addLog('❌ Connection Validation Failed.');
                return;
            }

            // Schedule next poll ONLY if not finished
            pollingIntervalRef.current = setTimeout(poll, 3000);
        };

        // Start first poll
        poll();
    };

    const autoClaimDevice = async (token, userToken) => {
        try {
            addLog('Auto-claiming device...');
            const configReq = { headers: { Authorization: `Bearer ${userToken}` } };
            await axios.post(
                `${APP_BASE_URL}/api/devices/claim`,
                { pairingToken: token, name: 'ESP32 Device' },
                configReq
            );
            addLog('🎉 Device Successfully Claimed!');
            setStatus('complete');
        } catch (error) {
            console.error(error);
            addLog(`Claim Error: ${error.response?.data?.message || error.message}`);
            setStatus('error');
        }
    };

    const resetProvisioning = () => {
        // Optional: Close port? For now, we want to keep it if we just want to reset state but keep connection
        // But usually reset means "Start Over"
        setStatus('disconnected');
        setLogs([]);
        setDeviceMac(null);
        // We do NOT close the port here to allow easy retry, but we might loose sync.
        // Let's keep portRef but reset status to allow re-connection logic if needed
        // Or simply set to 'connected' if port exists
        if (portRef.current) {
            setStatus('connected');
        }
    };

    return (
        <ProvisionContext.Provider value={{
            status,
            logs,
            deviceMac,
            config,
            setConfig,
            connectToDevice,
            saveConfigToDevice,
            retryGetInfo,
            resetProvisioning
        }}>
            {children}
        </ProvisionContext.Provider>
    );
};
