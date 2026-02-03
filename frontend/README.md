# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

## If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## 🧠 Frontend Technical Algorithms

### 1. Live Data Subscription (MQTT-over-WebSocket)

The frontend preserves real-time reactivity without constant polling:

1.  **Mount**: When `DeviceDetail` component mounts, it initiates a connection to the MQTT broker using `mqtt.js` over WebSockets (default port 8883/9001).
2.  **Subscription**: It subscribes to the specific device topic: `telemetry/device_id`.
3.  **State Sync**: Every incoming message triggers a React state update:
    ```javascript
    const [liveData, setLiveData] = useState([]);
    client.on("message", (topic, payload) => {
      const data = JSON.parse(payload);
      setLiveData((prev) => [...prev.slice(-19), data]); // Keep last 20 points
    });
    ```

### 2. Time-Series Data Aggregation

To prevent the browser from crashing when viewing months of data:

1.  **Request**: Frontend requests data with a `period` param (e.g., `?range=30d`).
2.  **Backend Bucketing**: The server doesn't send every 5s point. It uses MongoDB `$bucket` or `$group` to average data points into "Day" or "Hour" blocks.
3.  **Frontend Smoothing**: `Recharts` uses a monotonic curve type (`type="monotone"`) to interpolate smooth lines between the aggregated data points, providing a visually premium experience.
