// APP_BASE_URL: Used by the browser (React App) to talk to the backend.
// 'localhost' is most reliable for your local browser.
export const APP_BASE_URL = "http://localhost:5000";

// DEVICE_BASE_URL: Used by the ESP32 to talk to the backend.
// The ESP32 cannot use 'localhost', it needs your computer's local network IP.
// Ensure this IP matches your computer's IP address on the network.
export const DEVICE_BASE_URL = "http://192.168.0.103:5000";
